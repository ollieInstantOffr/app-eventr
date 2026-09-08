import { prisma } from "@/server/db";
import { eventChannel } from "@/server/events/channel";
import { sseResponse } from "@/server/events";

export const dynamic = "force-dynamic";

/**
 * The public live channel for one event: entry counts for the booth screen and
 * the share page, and draw results for the projector. Open to anyone with the
 * event's link, because everything on it is already public-facing.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  });

  if (!event) return new Response("Not found", { status: 404 });

  return sseResponse(eventChannel(event.id));
}
