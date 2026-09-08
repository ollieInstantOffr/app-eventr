import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { assertEventInScope } from "@/server/auth/rbac";
import { resolveBranding } from "@/server/events/access";
import { displayUrl, entryUrl } from "@/server/qr/qr";
import { buildPosterPdf, type PosterSize } from "@/server/qr/poster";
import { formatTime } from "@/lib/format";

/** "Download poster PDF · A4 · A3" from screen 1c. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  assertEventInScope(session, id);

  const event = await prisma.event.findFirst({
    where: { id, organisationId: session.membership.organisationId, deletedAt: null },
    include: { prizes: { orderBy: { order: "asc" } } },
  });
  if (!event) return new NextResponse("Not found", { status: 404 });

  const organisation = session.membership.organisation;
  const branding = resolveBranding(event, organisation);
  const size: PosterSize = new URL(request.url).searchParams.get("size") === "A3" ? "A3" : "A4";

  const prizeNames = event.prizes.map((prize) => prize.name);
  const prizeLine =
    prizeNames.length === 0
      ? "Enter on your phone — it takes twenty seconds."
      : `Win ${listPhrase(prizeNames)}.`;

  const pdf = await buildPosterPdf({
    size,
    eventName: event.name,
    organisationName: organisation.name,
    headline: "Scan to enter the raffle",
    prizeLine,
    url: entryUrl(env.APP_URL, event.slug),
    displayUrl: displayUrl(env.APP_URL, event.slug),
    accentColour: branding.accentColour,
    logoKey: branding.logoKey,
    closesAt: event.entriesCloseAt ? `Entries close at ${formatTime(event.entriesCloseAt)}` : null,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${event.slug}-poster-${size}.pdf"`,
    },
  });
}

function listPhrase(items: string[]): string {
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}
