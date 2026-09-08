import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { GlassPanel, PanelSection } from "@/components/ui/glass-panel";
import { formatDateTime, formatTime } from "@/lib/format";
import { prisma } from "@/server/db";
import { requireEventAccess } from "@/server/events/access";
import { WinnerRowActions } from "./winner-row-actions";
import { NotifyAllButton } from "./notify-all-button";
import { ClaimWindowPicker } from "./claim-window-picker";

export const metadata = { title: "Winners" };

/** Screen 7c. */
export default async function WinnersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireEventAccess(id);

  const event = await prisma.event.findFirst({
    where: { id, organisationId: session.membership.organisationId, deletedAt: null },
    include: {
      prizes: {
        orderBy: { order: "asc" },
        include: {
          winners: {
            where: { supersededAt: null },
            include: { entry: true },
            orderBy: { drawnAt: "asc" },
          },
        },
      },
    },
  });
  if (!event) notFound();

  const rows = event.prizes.flatMap((prize, index) =>
    prize.winners.map((winner) => ({ prize, prizeOrder: index + 1, winner })),
  );

  const undelivered = rows.filter((row) => !row.winner.deliveredAt).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="sticky top-5 z-20 -mx-1 flex flex-wrap items-end justify-between gap-4 bg-screen px-1 py-3 sm:top-6">
        <div>
          <p className="text-[12.5px] font-bold text-ink-muted">
            <Link href="/events" className="hover:text-violet">
              Events
            </Link>{" "}
            / {event.name}
          </p>
          <h1 className="mt-0.5 text-[28px] font-extrabold">Winners</h1>
        </div>
        <div className="flex gap-2">
          <ButtonLink
            href={`/api/events/${event.id}/entries/export?filter=winners`}
            variant="secondary"
            prefetch={false}
          >
            Export winners
          </ButtonLink>
          {rows.length > 0 ? <NotifyAllButton eventId={event.id} /> : null}
        </div>
      </header>

      {rows.length === 0 ? (
        <GlassPanel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <h2 className="text-[19px] font-extrabold">No winners yet</h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-secondary">
            Winners appear here the moment a prize is drawn, with their contact details and a claim
            code to check at the stand.
          </p>
          <ButtonLink href={`/events/${event.id}/live`} className="mt-2">
            Open the live draw
          </ButtonLink>
        </GlassPanel>
      ) : (
        <GlassPanel className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="text-[11.5px] font-bold text-ink-muted">
                <th scope="col" className="px-4 py-3">Prize</th>
                <th scope="col" className="px-4 py-3">Winner</th>
                <th scope="col" className="px-4 py-3">Contact</th>
                <th scope="col" className="px-4 py-3">Notified</th>
                <th scope="col" className="px-4 py-3">Claim</th>
                <th scope="col" className="px-4 py-3 text-right">Prize</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6">
              {rows.map(({ prize, prizeOrder, winner }) => (
                <tr key={winner.id}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-tint text-[11px] font-extrabold text-violet-deep"
                      >
                        {prizeOrder}
                      </span>
                      <span className="text-[13px] font-bold">{prize.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold">
                    {winner.entry.name ?? `Entry #${winner.entry.number}`}
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-ink-secondary">
                    <span className="block">{winner.entry.email ?? "—"}</span>
                    {winner.entry.phone ? (
                      <span className="block text-ink-muted">{winner.entry.phone}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[12.5px]">
                    {winner.notifiedEmailAt || winner.notifiedSmsAt ? (
                      <span className="text-ink-secondary">
                        {[winner.notifiedEmailAt ? "Email" : null, winner.notifiedSmsAt ? "SMS" : null]
                          .filter(Boolean)
                          .join(" + ")}{" "}
                        · {formatTime(winner.notifiedEmailAt ?? winner.notifiedSmsAt)}
                      </span>
                    ) : (
                      <span className="text-ink-faint">Not yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-mono text-[13px] font-bold tracking-wider">
                      {winner.claimCode}
                    </span>
                    {winner.claimDeadline ? (
                      <span className="block text-[11.5px] text-ink-muted">
                        by {formatTime(winner.claimDeadline)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <WinnerRowActions
                      eventId={event.id}
                      winnerId={winner.id}
                      prizeId={prize.id}
                      delivered={winner.deliveredAt !== null}
                      canRedraw={
                        event.redrawEnabled &&
                        winner.claimDeadline !== null &&
                        winner.claimDeadline.getTime() < Date.now()
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <PanelSection
          title="Claim window"
          hint="Re-draw becomes available if not collected in time"
        >
          <ClaimWindowPicker eventId={event.id} value={event.claimWindow} />
        </PanelSection>

        <PanelSection title="Keep winner contact details">
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            Until a prize is marked delivered, that winner&rsquo;s contact details are kept even when
            the retention period passes &mdash; you still need to reach them. Once delivered, normal
            retention applies.
          </p>
          {undelivered > 0 ? (
            <p className="mt-3">
              <Badge tone="warn">
                {undelivered} prize{undelivered === 1 ? "" : "s"} not yet delivered
              </Badge>
            </p>
          ) : rows.length > 0 ? (
            <p className="mt-3">
              <Badge tone="live">All prizes delivered</Badge>
            </p>
          ) : null}
        </PanelSection>
      </div>

      {rows.length > 0 ? (
        <p className="px-1 text-[11.5px] text-ink-muted">
          Last drawn {formatDateTime(rows[rows.length - 1]?.winner.drawnAt)}. Every draw is recorded
          in the draw log, including re-draws.
        </p>
      ) : null}
    </div>
  );
}
