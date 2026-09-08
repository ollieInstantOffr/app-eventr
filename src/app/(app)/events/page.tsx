import Link from "next/link";
import { EventStatus } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatCount, formatDate, formatTime, formatToday } from "@/lib/format";
import { requireSession } from "@/server/auth/session";
import { dashboardStats, firstRunChecklist, listEvents } from "@/server/events/queries";
import { storage } from "@/server/storage";
import { FirstRunChecklist } from "./first-run-checklist";

export const metadata = { title: "Your events" };

const STATUS_TONE = {
  [EventStatus.DRAFT]: "neutral",
  [EventStatus.PUBLISHED]: "live",
  [EventStatus.CLOSED]: "warn",
  [EventStatus.COMPLETED]: "violet",
} as const;

const STATUS_LABEL = {
  [EventStatus.DRAFT]: "Draft",
  [EventStatus.PUBLISHED]: "Live",
  [EventStatus.CLOSED]: "Entries closed",
  [EventStatus.COMPLETED]: "Complete",
} as const;

export default async function EventsPage() {
  const session = await requireSession("/events");
  const organisationId = session.membership.organisationId;

  const [events, stats, checklist] = await Promise.all([
    listEvents(organisationId, session.membership.scopedEventId),
    dashboardStats(organisationId),
    firstRunChecklist(organisationId),
  ]);

  const firstName = session.user.firstName;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="text-[12.5px] font-bold text-ink-muted">{formatToday()}</p>
          <h1 className="mt-0.5 text-[28px] font-extrabold">
            {checklist.eventCount === 0 && firstName ? `Welcome, ${firstName}` : "Your events"}
          </h1>
          {checklist.eventCount === 0 ? (
            <p className="mt-1 text-[14px] text-ink-secondary">Let&rsquo;s set up your first raffle</p>
          ) : null}
        </div>
        <ButtonLink href="/events/new">+ New event</ButtonLink>
      </header>

      {checklist.doneCount < checklist.steps.length ? (
        <FirstRunChecklist steps={checklist.steps} doneCount={checklist.doneCount} />
      ) : null}

      {events.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassPanel className="p-5">
            <p className="text-[12px] font-bold text-ink-muted">Entries today</p>
            <p className="mt-1 text-[30px] font-extrabold tabular-nums">
              {formatCount(stats.entriesToday)}
            </p>
            {stats.entriesLastHour > 0 ? (
              <p className="mt-0.5 text-[12px] font-bold text-teal-darker">
                ▲ {formatCount(stats.entriesLastHour)} in the last hour
              </p>
            ) : (
              <p className="mt-0.5 text-[12px] text-ink-muted">Nothing in the last hour</p>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="text-[12px] font-bold text-ink-muted">Live events</p>
            <p className="mt-1 text-[30px] font-extrabold tabular-nums">{stats.liveEvents.length}</p>
            <p className="mt-0.5 truncate text-[12px] text-ink-muted">
              {stats.liveEvents[0]?.name ?? "None running right now"}
            </p>
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="text-[12px] font-bold text-ink-muted">Prizes to draw</p>
            <p className="mt-1 text-[30px] font-extrabold tabular-nums">{stats.prizesToDraw}</p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              {stats.nextDrawAt ? `Next draw ${formatTime(stats.nextDrawAt)}` : "No draw scheduled"}
            </p>
          </GlassPanel>
        </div>
      ) : null}

      {events.length === 0 ? (
        <GlassPanel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-chip bg-violet-tint text-[24px] font-extrabold text-violet">
            +
          </div>
          <h2 className="text-[19px] font-extrabold">No events yet</h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-secondary">
            Your events appear here with live entry counts and quick access to the QR and draw.
          </p>
          <ButtonLink href="/events/new" size="lg" className="mt-2">
            Create your first event
          </ButtonLink>
        </GlassPanel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <GlassPanel key={event.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-tile bg-violet-tint text-[10px] font-bold text-violet-deep">
                  {event.logoKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={storage.url(event.logoKey)} alt="" className="h-full w-full object-contain" />
                  ) : (
                    "logo"
                  )}
                </div>
                <Badge tone={STATUS_TONE[event.status]} dot={event.status === EventStatus.PUBLISHED}>
                  {STATUS_LABEL[event.status]}
                </Badge>
              </div>

              <div>
                <h2 className="text-[16px] font-extrabold leading-tight">
                  <Link href={`/events/${event.id}`} className="hover:text-violet">
                    {event.name}
                  </Link>
                </h2>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">{formatDate(event.eventDate)}</p>
              </div>

              <p className="text-[12.5px] text-ink-secondary">
                <strong className="text-ink">{formatCount(event._count.entries)}</strong> entries ·{" "}
                <strong className="text-ink">{event._count.prizes}</strong> prizes
              </p>

              <div className="mt-auto flex gap-2 pt-1">
                <ButtonLink href={`/events/${event.id}`} variant="secondary" size="sm" className="flex-1">
                  Open
                </ButtonLink>
                <ButtonLink
                  href={`/events/${event.id}/share`}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  Show QR
                </ButtonLink>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
