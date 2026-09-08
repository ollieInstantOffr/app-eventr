import { redirect } from "next/navigation";
import { EventStatus } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatDate, formatTime } from "@/lib/format";
import { requireSession } from "@/server/auth/session";
import { listEvents } from "@/server/events/queries";

export const metadata = { title: "Live draw" };

/** The sidebar's Live draw link. */
export default async function LiveIndexPage() {
  const session = await requireSession("/live");
  const events = await listEvents(session.membership.organisationId, session.membership.scopedEventId);

  const runnable = events.filter((event) => event.status !== EventStatus.DRAFT);
  if (runnable.length === 1) redirect(`/events/${runnable[0]!.id}/live`);

  return (
    <div className="flex flex-col gap-5">
      <header className="sticky top-0 z-20 -mx-1 -mt-5 surface px-1 pt-8 pb-3 sm:-mt-6 sm:pt-9">
        <h1 className="text-[28px] font-extrabold">Live draw</h1>
        <p className="mt-1 text-[14px] text-ink-secondary">
          Pick the event you&rsquo;re running, then open the public screen on the projector.
        </p>
      </header>

      {runnable.length === 0 ? (
        <GlassPanel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <h2 className="text-[19px] font-extrabold">Nothing to draw yet</h2>
          <p className="max-w-md text-[13.5px] text-ink-secondary">
            Publish an event and it appears here, ready to run on the big screen.
          </p>
          <ButtonLink href="/events/new" className="mt-2">
            Create your first event
          </ButtonLink>
        </GlassPanel>
      ) : (
        <GlassPanel className="p-0">
          <ul className="divide-y divide-black/6">
            {runnable.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold">{event.name || "Untitled event"}</span>
                  <span className="block text-[12px] text-ink-muted">
                    {formatDate(event.eventDate)}
                    {event.drawAt ? ` · draw at ${formatTime(event.drawAt)}` : ""} ·{" "}
                    {event._count.prizes} prizes
                  </span>
                </span>
                {event.status === EventStatus.PUBLISHED ? (
                  <Badge tone="live" dot>
                    Open
                  </Badge>
                ) : null}
                <ButtonLink href={`/events/${event.id}/live`} variant="secondary" size="sm">
                  Set up the draw
                </ButtonLink>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}
    </div>
  );
}
