import "server-only";
import { GuestRequestStatus, GuestRequestType, Prisma } from "@/generated/prisma";
import { prisma } from "@/server/db";

const AUTO_FULFIL_DELAY_MS = 24 * 60 * 60 * 1000;

/**
 * "Auto-fulfil erasure requests" from screen 4d: erase within 24 hours with
 * no manual review — except where the entry is a winner with an undelivered
 * prize, which always needs a person.
 */
export async function runGuestRequests(): Promise<void> {
  const cutoff = new Date(Date.now() - AUTO_FULFIL_DELAY_MS);

  const requests = await prisma.guestRequest.findMany({
    where: {
      type: GuestRequestType.ERASE,
      status: GuestRequestStatus.OPEN,
      requestedAt: { lte: cutoff },
      event: { organisation: { autoFulfilErasure: true } },
    },
    include: { entry: { include: { winner: true } } },
  });

  for (const request of requests) {
    if (!request.entry) {
      await prisma.guestRequest.update({
        where: { id: request.id },
        data: { status: GuestRequestStatus.FULFILLED, fulfilledAt: new Date() },
      });
      continue;
    }

    if (request.entry.winner && !request.entry.winner.deliveredAt) {
      // Left open deliberately: the organiser has to decide, because erasing
      // now means they cannot hand over the prize.
      continue;
    }

    await prisma.$transaction([
      prisma.entry.update({
        where: { id: request.entry.id },
        data: {
          data: {} as Prisma.InputJsonValue,
          name: null,
          email: null,
          phone: null,
          erasedAt: new Date(),
        },
      }),
      prisma.guestRequest.update({
        where: { id: request.id },
        data: {
          status: GuestRequestStatus.FULFILLED,
          fulfilledAt: new Date(),
          note: "Auto-fulfilled",
        },
      }),
    ]);
  }
}
