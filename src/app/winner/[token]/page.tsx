import { notFound } from "next/navigation";
import { GuestShell } from "@/components/guest/guest-shell";
import { formatTime } from "@/lib/format";
import { prisma } from "@/server/db";
import { resolveBranding } from "@/server/events/access";
import { storage } from "@/server/storage";

export const dynamic = "force-dynamic";
export const metadata = { title: "You won", robots: { index: false } };

/**
 * Screen 7c, right. Reached by an unguessable per-winner token, and shows
 * only that winner's own data — nothing about anyone else who entered.
 */
export default async function WinnerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const winner = await prisma.winner.findFirst({
    where: { accessToken: token, entry: { erasedAt: null } },
    include: {
      entry: true,
      prize: true,
      event: { include: { organisation: true } },
    },
  });

  if (!winner) notFound();

  const { event, entry, prize } = winner;
  const branding = resolveBranding(event, event.organisation);
  const firstName = entry.name?.split(/\s+/)[0] ?? null;

  const expired = winner.claimDeadline !== null && winner.claimDeadline.getTime() < Date.now();

  return (
    <GuestShell
      logoUrl={branding.logoKey ? storage.url(branding.logoKey) : null}
      organisationName={event.organisation.name}
      backgroundColour={branding.backgroundColour}
      footer={
        winner.claimDeadline ? (
          <>
            Claim by {formatTime(winner.claimDeadline)} · Powered by Eventr by instantoffr
          </>
        ) : undefined
      }
    >
      <p
        className="text-[12px] font-bold tracking-[0.14em] uppercase"
        style={{ color: branding.accentColour }}
      >
        You won
      </p>
      <h1 className="mt-1.5 font-serif text-[38px] leading-[1.1]">{prize.name}</h1>

      <p className="mt-3 text-[13.5px] leading-relaxed text-ink-secondary">
        {winner.deliveredAt ? (
          <>
            {firstName ? `${firstName}, this` : "This"} prize is marked as collected. Nothing more to
            do &mdash; enjoy it.
          </>
        ) : expired ? (
          <>
            The claim window for this prize has passed, so {event.organisation.name} may re-draw it.
            Get in touch with them if you still think it&rsquo;s yours.
          </>
        ) : (
          <>
            {firstName ? `Congratulations, ${firstName}` : "Congratulations"} &mdash; entry #
            {entry.number} was drawn at {formatTime(winner.drawnAt)}.
            {event.venueLabel ? (
              <>
                {" "}
                Collect it at <strong className="text-ink">{event.venueLabel}</strong>
              </>
            ) : null}
            {winner.claimDeadline ? <> before {formatTime(winner.claimDeadline)}</> : null}.
          </>
        )}
      </p>

      {!winner.deliveredAt && !expired ? (
        <div className="mt-5 rounded-panel bg-white px-5 py-4">
          <p className="text-[11.5px] font-bold text-ink-muted">Claim code</p>
          <p
            className="font-mono text-[34px] font-extrabold tracking-[0.1em] leading-tight"
            style={{ color: branding.accentColour }}
          >
            {winner.claimCode}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-muted">
            Show this to {event.organisation.name} staff
          </p>
        </div>
      ) : null}

      {event.organisation.replyToEmail && !winner.deliveredAt ? (
        <a
          href={`mailto:${event.organisation.replyToEmail}?subject=${encodeURIComponent(
            `Prize claim — ${prize.name} (entry #${entry.number}, code ${winner.claimCode})`,
          )}`}
          className="mt-4 block rounded-field bg-white px-4 py-3 text-center text-[13px] font-bold text-ink-secondary hover:text-ink"
        >
          Can&rsquo;t collect today? Arrange delivery
        </a>
      ) : null}

      <p className="mt-5 text-center text-[11.5px] leading-relaxed text-ink-muted">
        {event.organisation.name} runs this raffle and holds your details.{" "}
        <a href={`/${event.slug}/entry?t=${entry.accessToken}`} className="underline">
          Your data &amp; privacy
        </a>
      </p>
    </GuestShell>
  );
}
