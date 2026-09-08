import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { requireEventAccess, resolveBranding } from "@/server/events/access";
import { storage } from "@/server/storage";
import { LiveDrawSettings } from "./live-draw-settings";

export const metadata = { title: "Live draw" };

/** Screen 1f. */
export default async function LiveDrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireEventAccess(id);

  const event = await prisma.event.findFirst({
    where: { id, organisationId: session.membership.organisationId, deletedAt: null },
    include: {
      prizes: {
        orderBy: { order: "asc" },
        include: { winners: { where: { supersededAt: null }, include: { entry: true } } },
      },
    },
  });
  if (!event) notFound();

  const branding = resolveBranding(event, session.membership.organisation);
  const eligibleCount = await prisma.entry.count({
    where: { eventId: event.id, erasedAt: null, isDuplicate: false, winner: null },
  });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="text-[12.5px] font-bold text-ink-muted">
            <Link href="/events" className="hover:text-violet">
              Events
            </Link>{" "}
            / {event.name}
          </p>
          <h1 className="mt-0.5 text-[28px] font-extrabold">Live draw</h1>
        </div>
      </header>

      <LiveDrawSettings
        eventId={event.id}
        slug={event.slug}
        organisationName={session.membership.organisation.name}
        logoUrl={branding.logoKey ? storage.url(branding.logoKey) : null}
        accentColour={branding.accentColour}
        backgroundColour={branding.backgroundColour}
        settings={{
          animation: event.animation,
          suspenseSeconds: event.suspenseSeconds,
          showLogo: event.showLogo,
          showEntryCount: event.showEntryCount,
          maskPersonalData: event.maskPersonalData,
          confettiOnWin: event.confettiOnWin,
          redrawEnabled: event.redrawEnabled,
        }}
        eligibleCount={eligibleCount}
        prizes={event.prizes.map((prize, index) => ({
          id: prize.id,
          order: index + 1,
          name: prize.name,
          meta: prize.meta,
          winnerCount: prize.winnerCount,
          winnerName: prize.winners[0]?.entry.name ?? null,
          drawn: prize.winners.length >= prize.winnerCount,
        }))}
      />
    </div>
  );
}
