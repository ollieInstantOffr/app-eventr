import "server-only";
import { EventStatus } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { publishLive } from "@/server/events/channel";

/** Entries close by themselves at entriesCloseAt — nobody has to remember. */
export async function runAutoClose(): Promise<void> {
  const due = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      deletedAt: null,
      entriesCloseAt: { lte: new Date() },
    },
    select: { id: true },
  });

  for (const event of due) {
    await prisma.event.update({
      where: { id: event.id },
      data: { status: EventStatus.CLOSED, closedAt: new Date() },
    });
    publishLive(event.id, { type: "status", status: "CLOSED" });
  }
}
