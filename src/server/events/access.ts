import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { assertEventInScope } from "@/server/auth/rbac";
import { requireSession, type AuthenticatedSession } from "@/server/auth/session";

/**
 * Asserts the signed-in member may act on this event, honouring an
 * event-scoped membership, and returns the session. Callers then run whatever
 * query they need — scoped to the session's organisation.
 */
export async function requireEventAccess(eventId: string): Promise<AuthenticatedSession> {
  const session = await requireSession(`/events/${eventId}`);
  assertEventInScope(session, eventId);
  return session;
}

/** Throws a 404 rather than leaking that an id exists in another organisation. */
export async function eventOr404(eventId: string, organisationId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organisationId, deletedAt: null },
  });
  if (!event) notFound();
  return event;
}

/** The branding an event actually renders with: its own, else the organisation's. */
export function resolveBranding(
  event: { logoKey: string | null; accentColour: string | null; backgroundColour: string | null },
  organisation: { logoKey: string | null; accentColour: string },
) {
  return {
    logoKey: event.logoKey ?? organisation.logoKey,
    accentColour: event.accentColour ?? organisation.accentColour,
    backgroundColour: event.backgroundColour ?? "#F2F0EB",
  };
}
