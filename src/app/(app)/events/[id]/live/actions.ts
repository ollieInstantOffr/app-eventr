"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DrawAnimation, Prisma } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { assertCan, assertEventInScope } from "@/server/auth/rbac";
import { drawWinner, nextPrize, redrawPrize, type DrawOptions } from "@/server/draw/engine";
import { generatePairingCode, expiresIn, KIOSK_PAIRING_TTL_MS } from "@/server/auth/tokens";

const settingsSchema = z.object({
  animation: z.nativeEnum(DrawAnimation),
  suspenseSeconds: z.number().int().min(2).max(20),
  showLogo: z.boolean(),
  showEntryCount: z.boolean(),
  maskPersonalData: z.boolean(),
  confettiOnWin: z.boolean(),
  redrawEnabled: z.boolean(),
});

export type DrawSettings = z.infer<typeof settingsSchema>;

async function authorise(eventId: string) {
  const session = await requireSession();
  assertCan(session, "draw:run");
  assertEventInScope(session, eventId);

  const event = await prisma.event.findFirst({
    where: { id: eventId, organisationId: session.membership.organisationId, deletedAt: null },
  });
  if (!event) throw new Error("Event not found");

  return { session, event };
}

/** Screen 1f's left column. */
export async function saveDrawSettings(eventId: string, settings: DrawSettings): Promise<void> {
  const { event } = await authorise(eventId);
  const parsed = settingsSchema.parse(settings);

  await prisma.event.update({ where: { id: event.id }, data: parsed });
  revalidatePath(`/events/${event.id}/live`);
}

export type DrawActionResult =
  | { ok: true; prizeName: string; winnerName: string }
  | { ok: false; reason: "no-eligible-entries" | "prize-complete" | "not-drawable" | "complete" };

/** Space on the public screen, and the "Draw next prize" button on the laptop. */
export async function drawNextPrize(
  eventId: string,
  options: DrawOptions = {},
): Promise<DrawActionResult> {
  const { session, event } = await authorise(eventId);

  const prize = await nextPrize(event.id);
  if (!prize) return { ok: false, reason: "complete" };

  const result = await drawWinner({
    event,
    prizeId: prize.id,
    triggeredByUserId: session.user.id,
    drawOptions: options,
  });

  if (!result.ok) return { ok: false, reason: result.reason };

  revalidatePath(`/events/${event.id}/live`);
  return {
    ok: true,
    prizeName: result.prize.name,
    winnerName: result.entry.name ?? `Entry #${result.entry.number}`,
  };
}

/** R on the public screen — the winner has left the hall. */
export async function redrawCurrentPrize(
  eventId: string,
  prizeId: string,
  reason?: string,
): Promise<DrawActionResult> {
  const { session, event } = await authorise(eventId);

  const result = await redrawPrize({
    event,
    prizeId,
    triggeredByUserId: session.user.id,
    reason,
  });

  if (!result.ok) return { ok: false, reason: result.reason };

  revalidatePath(`/events/${event.id}/live`);
  return {
    ok: true,
    prizeName: result.prize.name,
    winnerName: result.entry.name ?? `Entry #${result.entry.number}`,
  };
}

/**
 * Reconciles winners the public screen drew while the venue Wi-Fi was down
 * (screen 7f). Draws that already landed are skipped, so reconnecting twice
 * cannot double-draw.
 */
export async function reconcileOfflineDraws(
  eventId: string,
  drawn: Array<{ prizeId: string; entryNumber: number; drawnAt: string }>,
): Promise<{ applied: number }> {
  const { session, event } = await authorise(eventId);
  let applied = 0;

  for (const record of drawn) {
    const existing = await prisma.winner.count({
      where: { prizeId: record.prizeId, supersededAt: null },
    });
    if (existing > 0) continue;

    const entry = await prisma.entry.findFirst({
      where: { eventId: event.id, number: record.entryNumber, erasedAt: null },
    });
    if (!entry) continue;

    await prisma.$transaction(async (tx) => {
      const winner = await tx.winner.create({
        data: {
          eventId: event.id,
          prizeId: record.prizeId,
          entryId: entry.id,
          claimCode: (await import("@/server/auth/tokens")).generateClaimCode(),
          drawnAt: new Date(record.drawnAt),
        },
      });

      await tx.drawLog.create({
        data: {
          eventId: event.id,
          prizeId: record.prizeId,
          algorithm: "crypto.getRandomValues/offline-v1",
          eligibleCount: 0,
          eligibleHash: "",
          selectedEntryId: entry.id,
          selectedNumber: entry.number,
          drawnOffline: true,
          reason: "Drawn on the public screen while offline, reconciled on reconnect",
          triggeredByUserId: session.user.id,
        },
      });

      return winner;
    });

    applied += 1;
  }

  revalidatePath(`/events/${event.id}/live`);
  return { applied };
}

/** "Pair the booth screen" from screen 7g. */
export async function createKioskPairing(
  eventId: string,
): Promise<{ code: string; expiresAt: string }> {
  const { session, event } = await authorise(eventId);
  assertCan(session, "team:manage");

  // Only one live code at a time, so an old one on a screen somewhere can't
  // still pair a device.
  await prisma.kioskPairing.deleteMany({ where: { eventId: event.id, claimedAt: null } });

  const pairing = await prisma.kioskPairing.create({
    data: {
      eventId: event.id,
      code: generatePairingCode(),
      expiresAt: expiresIn(KIOSK_PAIRING_TTL_MS),
    },
  });

  await prisma.auditLog.create({
    data: {
      organisationId: session.membership.organisationId,
      userId: session.user.id,
      action: "kiosk.pairing_created",
      targetType: "event",
      targetId: event.id,
      detail: {} as Prisma.InputJsonValue,
    },
  });

  return { code: pairing.code, expiresAt: pairing.expiresAt.toISOString() };
}
