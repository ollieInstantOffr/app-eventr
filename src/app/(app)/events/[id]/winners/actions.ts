"use server";

import { revalidatePath } from "next/cache";
import { ClaimWindow } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { assertCan, assertEventInScope } from "@/server/auth/rbac";
import { redrawPrize } from "@/server/draw/engine";
import { notifyWinner } from "@/server/winners/notify";

async function authorise(eventId: string) {
  const session = await requireSession();
  assertCan(session, "entry:read-personal");
  assertEventInScope(session, eventId);

  const event = await prisma.event.findFirst({
    where: { id: eventId, organisationId: session.membership.organisationId, deletedAt: null },
  });
  if (!event) throw new Error("Event not found");
  return { session, event };
}

export async function notifyOneWinner(eventId: string, winnerId: string): Promise<void> {
  await authorise(eventId);
  await notifyWinner(winnerId);
  revalidatePath(`/events/${eventId}/winners`);
}

/** "Notify all winners" — safe to press twice; the send is deduplicated. */
export async function notifyAllWinners(eventId: string): Promise<{ notified: number }> {
  const { event } = await authorise(eventId);

  const winners = await prisma.winner.findMany({
    where: { eventId: event.id, supersededAt: null },
    select: { id: true },
  });

  let notified = 0;
  for (const winner of winners) {
    const result = await notifyWinner(winner.id);
    if (result.email || result.sms) notified += 1;
  }

  revalidatePath(`/events/${eventId}/winners`);
  return { notified };
}

/**
 * Marking a prize delivered is what releases the winner's contact details
 * back to the normal retention rules — until then the retention job leaves
 * them alone, because the organiser still needs to reach them.
 */
export async function markPrizeDelivered(
  eventId: string,
  winnerId: string,
  delivered: boolean,
): Promise<void> {
  await authorise(eventId);

  await prisma.winner.update({
    where: { id: winnerId },
    data: { deliveredAt: delivered ? new Date() : null },
  });

  revalidatePath(`/events/${eventId}/winners`);
}

export async function redrawWinner(
  eventId: string,
  prizeId: string,
  reason: string,
): Promise<{ ok: boolean }> {
  const { session, event } = await authorise(eventId);
  assertCan(session, "draw:run");

  const result = await redrawPrize({
    event,
    prizeId,
    triggeredByUserId: session.user.id,
    reason,
  });

  revalidatePath(`/events/${eventId}/winners`);
  return { ok: result.ok };
}

export async function setClaimWindow(eventId: string, window: ClaimWindow): Promise<void> {
  const { event } = await authorise(eventId);
  await prisma.event.update({ where: { id: event.id }, data: { claimWindow: window } });
  revalidatePath(`/events/${eventId}/winners`);
}
