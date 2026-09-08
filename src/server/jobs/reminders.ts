import "server-only";
import { EventStatus } from "@/generated/prisma";
import { env } from "@/lib/env";
import { formatTime } from "@/lib/format";
import { prisma } from "@/server/db";
import { sendEmail } from "@/server/email/send";
import { entriesClosingEmail } from "@/server/email/templates/reminder";
import { once } from "@/server/jobs/scheduler";

const WINDOW_MS = 60 * 60 * 1000;

/**
 * The "entries close in 1 hour" email from screen 7i. One per event, sent to
 * the owner, and only if they haven't turned reminders off.
 */
export async function runEntriesClosingReminders(): Promise<void> {
  const now = Date.now();

  const due = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      deletedAt: null,
      entriesCloseAt: {
        gt: new Date(now),
        lte: new Date(now + WINDOW_MS),
      },
    },
    include: {
      organisation: {
        include: {
          memberships: {
            where: { role: "OWNER" },
            include: { user: true },
            take: 1,
          },
        },
      },
      _count: { select: { prizes: true } },
    },
  });

  for (const event of due) {
    const owner = event.organisation.memberships[0]?.user;
    if (!owner || !owner.remindersEnabled) continue;

    await once("entries-closing-reminder", event.id, async () => {
      const [entryCount, duplicateCount] = await Promise.all([
        prisma.entry.count({ where: { eventId: event.id, erasedAt: null } }),
        prisma.entry.count({ where: { eventId: event.id, erasedAt: null, isDuplicate: true } }),
      ]);

      const message = entriesClosingEmail({
        firstName: owner.firstName,
        eventName: event.name,
        closesAt: formatTime(event.entriesCloseAt),
        drawAt: event.drawAt ? formatTime(event.drawAt) : null,
        entryCount,
        duplicateCount,
        prizeCount: event._count.prizes,
        liveScreenUrl: `${env.APP_URL}/screen/${event.slug}`,
        entriesUrl: `${env.APP_URL}/events/${event.id}/entries`,
        settingsUrl: `${env.APP_URL}/settings/profile`,
      });

      await sendEmail({
        to: owner.email,
        template: "entries-closing",
        subject: message.subject,
        html: message.html,
        text: message.text,
        dedupeKey: `reminder:${event.id}`,
      });
    });
  }
}
