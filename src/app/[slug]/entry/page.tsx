import { notFound } from "next/navigation";
import { GuestShell } from "@/components/guest/guest-shell";
import { prisma } from "@/server/db";
import { resolveBranding } from "@/server/events/access";
import { formatTime } from "@/lib/format";
import { storage } from "@/server/storage";
import { GuestDataRequest } from "./guest-data-request";

export const dynamic = "force-dynamic";
export const metadata = { title: "You're in", robots: { index: false } };

/**
 * Screen 1d, second state. Reached with the entry's own access token, so a
 * guest can come back to it later — and it shows only their own data.
 */
export default async function EntryConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string; again?: string }>;
}) {
  const { slug } = await params;
  const { t: token, again } = await searchParams;

  if (!token) notFound();

  const entry = await prisma.entry.findFirst({
    where: { accessToken: token, erasedAt: null, event: { slug, deletedAt: null } },
    include: {
      event: {
        include: { organisation: true, prizes: { orderBy: { order: "asc" } } },
      },
      duplicateOf: { select: { number: true } },
    },
  });

  if (!entry) notFound();

  const { event } = entry;
  const branding = resolveBranding(event, event.organisation);
  const firstName = entry.name?.split(/\s+/)[0] ?? null;

  // A duplicate keeps the original entry number: they are already in once.
  const shownNumber = entry.duplicateOf?.number ?? entry.number;

  return (
    <GuestShell
      logoUrl={branding.logoKey ? storage.url(branding.logoKey) : null}
      organisationName={event.organisation.name}
      backgroundColour={branding.backgroundColour}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-chip text-[24px] font-extrabold text-white"
          style={{ background: branding.accentColour }}
          aria-hidden
        >
          ✓
        </div>

        <h1 className="mt-4 text-[22px] font-extrabold">
          {again ? "You're already in" : firstName ? `You're in, ${firstName}` : "You're in"}
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-secondary">
          {again
            ? "We found an earlier entry with these details, so we kept that one — one entry per person."
            : event.drawAt
              ? `Keep an eye on the main stage — winners are drawn at ${formatTime(event.drawAt)}.`
              : "Keep an eye on the stage — winners are drawn live."}
        </p>

        <div className="mt-5 w-full rounded-panel bg-white px-5 py-4">
          <p className="text-[11.5px] font-bold text-ink-muted">Your entry number</p>
          <p className="text-[30px] font-extrabold leading-tight" style={{ color: branding.accentColour }}>
            #{shownNumber}
          </p>
        </div>
      </div>

      {event.prizes.length > 0 ? (
        <ul className="mt-4 divide-y divide-black/6">
          {event.prizes.map((prize, index) => (
            <li key={prize.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13px] font-bold">
                {index + 1} · {prize.name}
              </span>
              <span className="shrink-0 text-[12.5px] text-ink-muted">
                {formatTime(drawTimeFor(event.drawAt, index))}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {event.drawAt ? (
        <a
          href={`/api/events/${event.id}/calendar`}
          className="mt-4 block rounded-field bg-white px-4 py-3 text-center text-[13px] font-bold text-ink-secondary hover:text-ink"
        >
          Add draw time to calendar
        </a>
      ) : null}

      <GuestDataRequest slug={slug} token={token} organisationName={event.organisation.name} />
    </GuestShell>
  );
}

/** The mockups space the prizes five minutes apart from the first draw. */
function drawTimeFor(drawAt: Date | null, index: number): Date | null {
  if (!drawAt) return null;
  return new Date(drawAt.getTime() + index * 5 * 60 * 1000);
}
