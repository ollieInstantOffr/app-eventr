import Link from "next/link";
import { notFound } from "next/navigation";
import { EventStatus } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { GlassPanel, PanelSection } from "@/components/ui/glass-panel";
import { QrCode } from "@/components/app/qr-code";
import { env } from "@/lib/env";
import { formatTime } from "@/lib/format";
import { prisma } from "@/server/db";
import { requireEventAccess, resolveBranding } from "@/server/events/access";
import { displayUrl, entryUrl, qrMatrix } from "@/server/qr/qr";
import { storage } from "@/server/storage";
import { CopyLinkButton } from "./copy-link-button";
import { LiveEntryCount } from "./live-entry-count";

export const metadata = { title: "Share the raffle" };

/** Screen 1c. */
export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireEventAccess(id);

  const event = await prisma.event.findFirst({
    where: { id, organisationId: session.membership.organisationId, deletedAt: null },
    include: { prizes: { orderBy: { order: "asc" } } },
  });
  if (!event) notFound();

  const organisation = session.membership.organisation;
  const branding = resolveBranding(event, organisation);
  const url = entryUrl(env.APP_URL, event.slug);
  const shortUrl = displayUrl(env.APP_URL, event.slug);
  const matrix = await qrMatrix(url);
  const entryCount = await prisma.entry.count({ where: { eventId: event.id, erasedAt: null } });

  const prizeLine =
    event.prizes.length > 0
      ? `Win ${event.prizes.map((prize) => prize.name).slice(0, 3).join(", ")}`
      : "Enter on your phone — it takes twenty seconds";

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
          <h1 className="mt-0.5 text-[28px] font-extrabold">Share the raffle</h1>
        </div>
        <nav className="flex gap-2">
          <ButtonLink href={`/events/${event.id}`} variant="secondary" size="sm">
            Overview
          </ButtonLink>
          <ButtonLink href={`/events/${event.id}/entries`} variant="secondary" size="sm">
            Entries
          </ButtonLink>
          <ButtonLink href={`/events/${event.id}/live`} variant="secondary" size="sm">
            Live draw
          </ButtonLink>
        </nav>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <GlassPanel className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-12 items-center">
            {branding.logoKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={storage.url(branding.logoKey)} alt={organisation.name} className="max-h-12" />
            ) : (
              <span className="text-[18px] font-extrabold">{organisation.name}</span>
            )}
          </div>

          <div>
            <h2 className="text-[22px] font-extrabold">Scan to enter the raffle</h2>
            <p className="mt-1 text-[13px] text-ink-muted">{prizeLine}</p>
          </div>

          <div className="w-full max-w-[280px] rounded-panel bg-white p-4">
            <QrCode matrix={matrix} dark="#1c1a27" label={`QR code linking to ${shortUrl}`} />
          </div>

          <p className="font-bold text-[14px]" style={{ color: branding.accentColour }}>
            {shortUrl}
          </p>
        </GlassPanel>

        <div className="flex flex-col gap-5">
          <PanelSection title="Get it in front of guests">
            <ul className="divide-y divide-black/6">
              <li className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block text-[13.5px] font-bold">Download poster PDF</span>
                  <span className="block text-[12px] text-ink-muted">Print it and put it on the stand</span>
                </span>
                <span className="flex shrink-0 gap-2">
                  <ButtonLink
                    href={`/api/events/${event.id}/poster?size=A4`}
                    variant="secondary"
                    size="sm"
                    prefetch={false}
                  >
                    A4
                  </ButtonLink>
                  <ButtonLink
                    href={`/api/events/${event.id}/poster?size=A3`}
                    variant="secondary"
                    size="sm"
                    prefetch={false}
                  >
                    A3
                  </ButtonLink>
                </span>
              </li>

              <li className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block text-[13.5px] font-bold">Open full-screen QR</span>
                  <span className="block text-[12px] text-ink-muted">For a booth screen</span>
                </span>
                <ButtonLink
                  href={`/screen/${event.slug}/qr`}
                  target="_blank"
                  variant="secondary"
                  size="sm"
                >
                  Open ↗
                </ButtonLink>
              </li>

              <li className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-bold">Copy link</span>
                  <span className="block truncate text-[12px] text-ink-muted">{shortUrl}</span>
                </span>
                <CopyLinkButton url={url} />
              </li>

              <li className="flex items-center justify-between gap-3 py-3">
                <span className="block text-[13.5px] font-bold">Download QR</span>
                <span className="flex shrink-0 gap-2">
                  <ButtonLink
                    href={`/api/events/${event.id}/qr?format=png`}
                    variant="secondary"
                    size="sm"
                    prefetch={false}
                  >
                    PNG
                  </ButtonLink>
                  <ButtonLink
                    href={`/api/events/${event.id}/qr?format=svg`}
                    variant="secondary"
                    size="sm"
                    prefetch={false}
                  >
                    SVG
                  </ButtonLink>
                </span>
              </li>
            </ul>
          </PanelSection>

          <PanelSection
            title="Live right now"
            action={
              event.status === EventStatus.PUBLISHED ? (
                <Badge tone="live" dot>
                  Open
                </Badge>
              ) : (
                <Badge tone="warn">Entries closed</Badge>
              )
            }
          >
            <LiveEntryCount slug={event.slug} initialCount={entryCount} />
            <p className="mt-1 text-[12.5px] text-ink-muted">
              entries
              {event.entriesCloseAt ? ` · closes at ${formatTime(event.entriesCloseAt)}` : ""}
            </p>
          </PanelSection>
        </div>
      </div>
    </div>
  );
}
