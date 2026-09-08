import "server-only";
import { EventStatus, type Entry, type Event, type Prize } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { generateClaimCode } from "@/server/auth/tokens";
import { publishLive } from "@/server/events/channel";
import { shortenName, maskEmail } from "@/server/auth/redaction";
import { hashPool } from "@/server/draw/pool";
import { selectUniform, shuffle } from "@/server/draw/selection";

export const DRAW_ALGORITHM = "crypto.randomInt/uniform-v1";

export type DrawOptions = {
  /** "Allow previous winners" on the no-eligible-entries overlay (screen 7f). */
  allowPreviousWinners?: boolean;
  /** "Include duplicates" on the same overlay. */
  includeDuplicates?: boolean;
  /** Set when reconciling a draw the public screen made while offline. */
  drawnOffline?: boolean;
};

export type DrawResult =
  | { ok: true; winnerId: string; entry: Entry; prize: Prize; eligibleCount: number }
  | { ok: false; reason: "no-eligible-entries" | "prize-complete" | "not-drawable" };

/**
 * Every entry the draw may pick from, given the event's rules and any
 * overrides the organiser chose on the overlay.
 */
export async function eligibleEntries(
  eventId: string,
  options: DrawOptions = {},
): Promise<Entry[]> {
  return prisma.entry.findMany({
    where: {
      eventId,
      erasedAt: null,
      ...(options.includeDuplicates ? {} : { isDuplicate: false }),
      ...(options.allowPreviousWinners ? {} : { winner: null }),
    },
    orderBy: { number: "asc" },
  });
}

/** The next prize Space should draw: the first that still needs a winner. */
export async function nextPrize(eventId: string): Promise<Prize | null> {
  const prizes = await prisma.prize.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    include: { winners: { where: { supersededAt: null } } },
  });

  for (const prize of prizes) {
    if (prize.winners.length < prize.winnerCount) return prize;
  }
  return null;
}

/**
 * Draws one winner for one prize.
 *
 * Selection is `crypto.randomInt`, which is uniform and cryptographically
 * secure — not `Math.random`. The whole thing runs in a transaction with a
 * conditional insert, so two Space presses in the same second cannot both
 * produce a winner for the same prize slot.
 */
export async function drawWinner(options: {
  event: Event;
  prizeId: string;
  triggeredByUserId?: string | null;
  drawOptions?: DrawOptions;
}): Promise<DrawResult> {
  const { event, prizeId } = options;
  const drawOptions = options.drawOptions ?? {};

  if (event.status === EventStatus.DRAFT) return { ok: false, reason: "not-drawable" };

  const prize = await prisma.prize.findFirst({
    where: { id: prizeId, eventId: event.id },
    include: { winners: { where: { supersededAt: null } } },
  });
  if (!prize) return { ok: false, reason: "not-drawable" };
  if (prize.winners.length >= prize.winnerCount) return { ok: false, reason: "prize-complete" };

  const pool = await eligibleEntries(event.id, drawOptions);
  if (pool.length === 0) {
    await prisma.drawLog.create({
      data: {
        eventId: event.id,
        prizeId: prize.id,
        algorithm: DRAW_ALGORITHM,
        eligibleCount: 0,
        eligibleHash: hashPool([]),
        reason: "no-eligible-entries",
        triggeredByUserId: options.triggeredByUserId ?? null,
      },
    });
    return { ok: false, reason: "no-eligible-entries" };
  }

  const selected = selectUniform(pool)!;
  const eligibleHash = hashPool(pool);

  const winner = await prisma.$transaction(async (tx) => {
    // Re-check inside the transaction: another press may have filled the slot
    // between the read above and here.
    const live = await tx.winner.count({ where: { prizeId: prize.id, supersededAt: null } });
    if (live >= prize.winnerCount) return null;

    const created = await tx.winner.create({
      data: {
        eventId: event.id,
        prizeId: prize.id,
        entryId: selected.id,
        claimCode: generateClaimCode(),
        claimDeadline: claimDeadlineFor(event),
      },
    });

    await tx.drawLog.create({
      data: {
        eventId: event.id,
        prizeId: prize.id,
        algorithm: DRAW_ALGORITHM,
        eligibleCount: pool.length,
        eligibleHash,
        selectedEntryId: selected.id,
        selectedNumber: selected.number,
        triggeredByUserId: options.triggeredByUserId ?? null,
        drawnOffline: drawOptions.drawnOffline ?? false,
        reason: describeOverrides(drawOptions),
      },
    });

    return created;
  });

  if (!winner) return { ok: false, reason: "prize-complete" };

  await announceDraw(event, prize, selected, pool);
  await completeEventIfDrawn(event.id);

  return { ok: true, winnerId: winner.id, entry: selected, prize, eligibleCount: pool.length };
}

/**
 * Re-draw: supersedes the current winner and picks again, excluding them.
 * The superseded winner stays in the log — the draw history must show what
 * actually happened, not a tidied version of it.
 */
export async function redrawPrize(options: {
  event: Event;
  prizeId: string;
  triggeredByUserId?: string | null;
  reason?: string;
}): Promise<DrawResult> {
  const current = await prisma.winner.findFirst({
    where: { prizeId: options.prizeId, supersededAt: null },
    orderBy: { drawnAt: "desc" },
  });

  if (current) {
    await prisma.$transaction([
      prisma.winner.update({
        where: { id: current.id },
        data: {
          supersededAt: new Date(),
          supersededReason: options.reason ?? "Re-drawn — winner not present",
        },
      }),
      prisma.drawLog.create({
        data: {
          eventId: options.event.id,
          prizeId: options.prizeId,
          algorithm: DRAW_ALGORITHM,
          eligibleCount: 0,
          eligibleHash: "",
          supersededWinnerId: current.id,
          reason: options.reason ?? "Re-drawn — winner not present",
          triggeredByUserId: options.triggeredByUserId ?? null,
        },
      }),
    ]);
  }

  publishLive(options.event.id, { type: "redraw", prizeId: options.prizeId });

  return drawWinner({
    event: options.event,
    prizeId: options.prizeId,
    triggeredByUserId: options.triggeredByUserId,
  });
}

function describeOverrides(options: DrawOptions): string | null {
  const notes: string[] = [];
  if (options.allowPreviousWinners) notes.push("previous winners allowed");
  if (options.includeDuplicates) notes.push("duplicates included");
  if (options.drawnOffline) notes.push("drawn offline, reconciled later");
  return notes.length > 0 ? notes.join("; ") : null;
}

function claimDeadlineFor(event: Event): Date {
  const now = new Date();
  switch (event.claimWindow) {
    case "MINUTES_15":
      return new Date(now.getTime() + 15 * 60 * 1000);
    case "HOUR_1":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "DAYS_7":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default: {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay;
    }
  }
}

/**
 * Pushes the result to every connected screen. Names and emails are masked
 * here, according to the event's setting, so nothing unmasked ever leaves the
 * server on the public channel.
 */
async function announceDraw(event: Event, prize: Prize, entry: Entry, pool: Entry[]): Promise<void> {
  const prizes = await prisma.prize.findMany({
    where: { eventId: event.id },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  const mask = event.maskPersonalData;
  const data = (entry.data ?? {}) as Record<string, unknown>;
  const company = typeof data.company === "string" ? data.company : null;

  publishLive(event.id, {
    type: "draw",
    prizeId: prize.id,
    prizeName: prize.name,
    prizeIndex: prizes.findIndex((p) => p.id === prize.id) + 1,
    prizeTotal: prizes.length,
    winnerName: mask ? shortenName(entry.name) : (entry.name ?? "Guest"),
    winnerDetail: company ?? (mask ? maskEmail(entry.email) : entry.email),
    entryNumber: entry.number,
    // A sample of the pool for the reel and wheel to animate through. Masked
    // the same way, and never the whole list.
    pool: samplePool(pool, entry, mask),
    drawnAt: new Date().toISOString(),
  });
}

const REEL_SAMPLE = 40;

function samplePool(pool: Entry[], winner: Entry, mask: boolean): string[] {
  // Shuffled, so the reel doesn't always show the same faces.
  const names = shuffle(
    pool
      .filter((entry) => entry.id !== winner.id)
      .map((entry) => (mask ? shortenName(entry.name) : (entry.name ?? "Guest"))),
  );

  const sample = names.slice(0, REEL_SAMPLE - 1);
  sample.push(mask ? shortenName(winner.name) : (winner.name ?? "Guest"));
  return sample;
}

async function completeEventIfDrawn(eventId: string): Promise<void> {
  const remaining = await nextPrize(eventId);
  if (remaining) return;

  await prisma.event.updateMany({
    where: { id: eventId, status: { in: [EventStatus.PUBLISHED, EventStatus.CLOSED] } },
    data: { status: EventStatus.COMPLETED },
  });

  publishLive(eventId, { type: "status", status: "COMPLETED" });
}

/** The draw log, for the "provably fair" claim and the Art. 30 record. */
export async function drawHistory(eventId: string) {
  return prisma.drawLog.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
