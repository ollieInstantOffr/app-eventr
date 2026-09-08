import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatCount, formatDate } from "@/lib/format";
import { requireSession } from "@/server/auth/session";
import { listEvents } from "@/server/events/queries";

export const metadata = { title: "Entries" };

/**
 * The sidebar's Entries link. Entries belong to an event, so with exactly
 * one event this goes straight there; with several it asks which. With none
 * at all it stays right here and shows that plainly — this is the Entries
 * page with nothing in it yet, not a bounce back to the events dashboard.
 */
export default async function EntriesIndexPage() {
  const session = await requireSession("/entries");
  const events = await listEvents(session.membership.organisationId, session.membership.scopedEventId);

  if (events.length === 1) redirect(`/events/${events[0]!.id}/entries`);

  return (
    <div className="flex flex-col gap-5">
      <header className="sticky top-5 z-20 -mx-1 bg-screen px-1 py-3 sm:top-6">
        <h1 className="text-[28px] font-extrabold">Entries</h1>
        <p className="mt-1 text-[14px] text-ink-secondary">
          {events.length === 0
            ? "Everyone who scans a QR code shows up here."
            : "Pick an event to see who has entered."}
        </p>
      </header>

      {events.length === 0 ? (
        <GlassPanel className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <h2 className="text-[17px] font-extrabold">No entries yet</h2>
          <p className="max-w-md text-[13px] leading-relaxed text-ink-secondary">
            The first scan shows up here instantly — you just need an event publishing entries
            first.
          </p>
          <ButtonLink href="/events/new" size="sm" className="mt-3">
            Create your first event
          </ButtonLink>
        </GlassPanel>
      ) : (
        <GlassPanel className="p-0">
          <ul className="divide-y divide-black/6">
            {events.map((event) => (
              <li key={event.id} className="flex items-center gap-3 px-5 py-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold">{event.name || "Untitled event"}</span>
                  <span className="block text-[12px] text-ink-muted">
                    {formatDate(event.eventDate)} · {formatCount(event._count.entries)} entries
                  </span>
                </span>
                <ButtonLink href={`/events/${event.id}/entries`} variant="secondary" size="sm">
                  Open
                </ButtonLink>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}
    </div>
  );
}
