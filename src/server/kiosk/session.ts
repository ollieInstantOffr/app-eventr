import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";
import { env } from "@/lib/env";
import { generateToken, hashToken } from "@/server/auth/tokens";
import { rateLimit } from "@/server/auth/rate-limit";

export const KIOSK_COOKIE = "eventr_kiosk";

export type KioskContext = { deviceId: string; eventId: string; slug: string };

/**
 * A booth device's credential. Deliberately narrow: it identifies one device
 * bound to one event, and the only things it can reach are the QR screen and
 * the public draw. It never carries a user, so it can never read entries.
 */
export async function pairKiosk(
  code: string,
  ip: string,
): Promise<{ ok: true; slug: string } | { ok: false; reason: "invalid" | "rate-limited" }> {
  // Six digits is a small space; without this, a booth URL plus a script
  // could brute-force a pairing.
  const limit = rateLimit(`kiosk-pair:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) return { ok: false, reason: "rate-limited" };

  const pairing = await prisma.kioskPairing.findUnique({
    where: { code },
    include: { event: { select: { id: true, slug: true, entriesCloseAt: true, drawAt: true } } },
  });

  if (!pairing || pairing.claimedAt || pairing.expiresAt <= new Date()) {
    return { ok: false, reason: "invalid" };
  }

  const token = generateToken();

  // The pairing lasts until the event ends — a day past the draw, so the
  // booth screen doesn't go dark mid-afternoon.
  const expiresAt = new Date(
    (pairing.event.drawAt ?? pairing.event.entriesCloseAt ?? new Date()).getTime() +
      24 * 60 * 60 * 1000,
  );

  await prisma.$transaction([
    prisma.kioskPairing.update({ where: { id: pairing.id }, data: { claimedAt: new Date() } }),
    prisma.kioskDevice.create({
      data: {
        tokenHash: hashToken(token),
        eventId: pairing.eventId,
        pairingId: pairing.id,
        label: "Booth screen",
        expiresAt,
      },
    }),
  ]);

  const cookieStore = await cookies();
  cookieStore.set(KIOSK_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { ok: true, slug: pairing.event.slug };
}

export async function getKioskContext(): Promise<KioskContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(KIOSK_COOKIE)?.value;
  if (!token) return null;

  const device = await prisma.kioskDevice.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { event: { select: { id: true, slug: true } } },
  });

  if (!device || device.revokedAt || device.expiresAt <= new Date()) return null;

  if (!device.lastSeenAt || Date.now() - device.lastSeenAt.getTime() > 60_000) {
    await prisma.kioskDevice.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });
  }

  return { deviceId: device.id, eventId: device.eventId, slug: device.event.slug };
}
