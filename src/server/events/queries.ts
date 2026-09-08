import "server-only";
import { EventStatus } from "@/generated/prisma";
import { prisma } from "@/server/db";

/** Cards on the dashboard: name, status, date, entry and prize counts. */
export async function listEvents(organisationId: string, scopedEventId?: string | null) {
  return prisma.event.findMany({
    where: {
      organisationId,
      deletedAt: null,
      ...(scopedEventId ? { id: scopedEventId } : {}),
    },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { entries: true, prizes: true } },
    },
  });
}

/** The three stat cards at the top of the dashboard. */
export async function dashboardStats(organisationId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const anHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [entriesToday, entriesLastHour, liveEvents, undrawn] = await Promise.all([
    prisma.entry.count({
      where: {
        event: { organisationId, deletedAt: null },
        createdAt: { gte: startOfDay },
        erasedAt: null,
      },
    }),
    prisma.entry.count({
      where: {
        event: { organisationId, deletedAt: null },
        createdAt: { gte: anHourAgo },
        erasedAt: null,
      },
    }),
    prisma.event.findMany({
      where: { organisationId, deletedAt: null, status: EventStatus.PUBLISHED },
      select: { id: true, name: true, drawAt: true },
      orderBy: { drawAt: "asc" },
    }),
    prisma.prize.findMany({
      where: {
        event: {
          organisationId,
          deletedAt: null,
          status: { in: [EventStatus.PUBLISHED, EventStatus.CLOSED] },
        },
      },
      select: {
        id: true,
        winnerCount: true,
        _count: { select: { winners: true } },
        event: { select: { drawAt: true } },
      },
    }),
  ]);

  // A prize is still "to draw" until it has as many winners as it needs.
  const prizesToDraw = undrawn.filter((prize) => prize._count.winners < prize.winnerCount).length;
  const nextDrawAt = undrawn
    .map((prize) => prize.event.drawAt)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return {
    entriesToday,
    entriesLastHour,
    liveEvents,
    prizesToDraw,
    nextDrawAt: nextDrawAt ?? null,
  };
}

/** Drives the first-run checklist on an empty account (screen 7e). */
export async function firstRunChecklist(organisationId: string) {
  const [organisation, eventCount, drawCount] = await Promise.all([
    prisma.organisation.findUnique({ where: { id: organisationId }, select: { logoKey: true } }),
    prisma.event.count({ where: { organisationId, deletedAt: null } }),
    prisma.drawLog.count({ where: { event: { organisationId } } }),
  ]);

  const steps = [
    {
      key: "account",
      label: "Create your account",
      hint: "Done — welcome to Eventr.",
      done: true,
      href: null,
    },
    {
      key: "logo",
      label: "Add your logo",
      hint: "Shown on the QR poster, guests' phones and the live screen.",
      done: Boolean(organisation?.logoKey),
      href: "/settings/organisation",
    },
    {
      key: "event",
      label: "Create an event",
      hint: "Name, date, prizes and the details you want from guests.",
      done: eventCount > 0,
      href: "/events/new",
    },
    {
      key: "draw",
      label: "Test the live draw",
      hint: "Open the public screen and press space — with sample names.",
      done: drawCount > 0,
      href: eventCount > 0 ? "/live" : "/events/new",
    },
  ];

  return { steps, doneCount: steps.filter((step) => step.done).length, eventCount };
}
