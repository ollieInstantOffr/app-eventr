import { notFound } from "next/navigation";
import { LiveScreen } from "@/components/screen/live-screen";
import type { ScreenWinner } from "@/components/screen/types";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/auth/rbac";
import { shortenName, maskEmail } from "@/server/auth/redaction";
import { resolveBranding } from "@/server/events/access";
import { storage } from "@/server/storage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live draw", robots: { index: false } };

/**
 * The projector screen. Public, because it is pointed at a room — but the
 * keyboard controls only unlock for a signed-in member who may run the draw,
 * so a passer-by cannot draw the next prize.
 */
export default async function PublicScreenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    include: {
      organisation: true,
      prizes: {
        orderBy: { order: "asc" },
        include: {
          winners: {
            where: { supersededAt: null },
            include: { entry: { select: { name: true, number: true, email: true, data: true } } },
          },
        },
      },
    },
  });

  if (!event) notFound();

  const branding = resolveBranding(event, event.organisation);
  const [entryCount, session] = await Promise.all([
    prisma.entry.count({ where: { eventId: event.id, erasedAt: null } }),
    getSession(),
  ]);

  const canControl =
    session?.membership?.organisationId === event.organisationId &&
    session.role !== null &&
    can(session.role, "draw:run");

  const mask = event.maskPersonalData;

  // Winners already drawn, so reopening the screen mid-event resumes rather
  // than starting over.
  const initialWinners: ScreenWinner[] = event.prizes.flatMap((prize, index) =>
    prize.winners.map((winner) => {
      const data = (winner.entry.data ?? {}) as Record<string, unknown>;
      const company = typeof data.company === "string" ? data.company : null;
      return {
        prizeId: prize.id,
        prizeName: prize.name,
        prizeIndex: index + 1,
        prizeTotal: event.prizes.length,
        winnerName: mask ? shortenName(winner.entry.name) : (winner.entry.name ?? "Guest"),
        winnerDetail: company ?? (mask ? maskEmail(winner.entry.email) : winner.entry.email),
        entryNumber: winner.entry.number,
        pool: [],
        drawnAt: winner.drawnAt.toISOString(),
      };
    }),
  );

  return (
    <LiveScreen
      config={{
        eventId: event.id,
        slug: event.slug,
        eventName: event.name,
        organisationName: event.organisation.name,
        logoUrl: branding.logoKey ? storage.url(branding.logoKey) : null,
        accentColour: branding.accentColour,
        backgroundColour: branding.backgroundColour,
        animation: event.animation,
        suspenseSeconds: event.suspenseSeconds,
        showLogo: event.showLogo,
        showEntryCount: event.showEntryCount,
        confettiOnWin: event.confettiOnWin,
        drawAt: event.drawAt?.toISOString() ?? null,
        entryCount,
        prizeCount: event.prizes.length,
        canControl,
      }}
      prizes={event.prizes.map((prize) => ({
        id: prize.id,
        name: prize.name,
        meta: prize.meta,
        winnerCount: prize.winnerCount,
      }))}
      initialWinners={initialWinners}
    />
  );
}
