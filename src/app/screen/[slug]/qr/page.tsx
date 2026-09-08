import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { prisma } from "@/server/db";
import { resolveBranding } from "@/server/events/access";
import { displayUrl, entryUrl, qrMatrix } from "@/server/qr/qr";
import { storage } from "@/server/storage";
import { BoothScreen } from "./booth-screen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Scan to enter", robots: { index: false } };

/**
 * Screen 7d — the full-screen QR for a booth display. Public, and safe to be:
 * it shows only the QR, a live count and the prizes on offer, never anyone's
 * details. That is what makes it safe on a paired kiosk device.
 */
export default async function BoothQrPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    include: { organisation: true, prizes: { orderBy: { order: "asc" } } },
  });
  if (!event) notFound();

  const branding = resolveBranding(event, event.organisation);
  const url = entryUrl(env.APP_URL, event.slug);
  const [matrix, entryCount] = await Promise.all([
    qrMatrix(url),
    prisma.entry.count({ where: { eventId: event.id, erasedAt: null } }),
  ]);

  return (
    <BoothScreen
      slug={event.slug}
      matrix={matrix}
      shortUrl={displayUrl(env.APP_URL, event.slug)}
      organisationName={event.organisation.name}
      eventName={event.name}
      logoUrl={branding.logoKey ? storage.url(branding.logoKey) : null}
      accentColour={branding.accentColour}
      backgroundColour={branding.backgroundColour}
      initialCount={entryCount}
      closesAt={event.entriesCloseAt?.toISOString() ?? null}
      drawAt={event.drawAt?.toISOString() ?? null}
      prizes={event.prizes.map((prize) => prize.name)}
    />
  );
}
