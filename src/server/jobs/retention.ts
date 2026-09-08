import "server-only";
import { Prisma, RetentionPeriod } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { RETENTION_DAYS } from "@/server/consent";

/**
 * Applies each event's retention policy. Two rules from the design govern it:
 *
 * 1. Entries are erased N days after the event, where N is the event's own
 *    period or the organisation's default.
 * 2. A winner whose prize is not yet marked delivered is skipped — screen 7c
 *    is explicit that those contact details are kept until delivery, because
 *    the organiser still has to reach them.
 *
 * Erasure clears the personal data and stamps erasedAt; the row itself stays
 * so entry numbers and the draw log remain coherent.
 */
export async function runRetention(): Promise<void> {
  const events = await prisma.event.findMany({
    where: { deletedAt: null, eventDate: { not: null } },
    select: {
      id: true,
      eventDate: true,
      retentionPeriod: true,
      organisation: { select: { retentionPeriod: true } },
    },
  });

  for (const event of events) {
    const period: RetentionPeriod = event.retentionPeriod ?? event.organisation.retentionPeriod;
    const cutoff = new Date(event.eventDate!.getTime() + RETENTION_DAYS[period] * 86_400_000);
    if (cutoff.getTime() > Date.now()) continue;

    const expired = await prisma.entry.findMany({
      where: {
        eventId: event.id,
        erasedAt: null,
        // Winners with an undelivered prize are exempt.
        OR: [{ winner: null }, { winner: { deliveredAt: { not: null } } }],
      },
      select: { id: true },
    });

    if (expired.length === 0) continue;

    await prisma.entry.updateMany({
      where: { id: { in: expired.map((entry) => entry.id) } },
      data: {
        data: {} as Prisma.InputJsonValue,
        name: null,
        email: null,
        phone: null,
        erasedAt: new Date(),
      },
    });
  }
}
