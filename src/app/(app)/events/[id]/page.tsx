import { notFound } from "next/navigation";
import { requireSession } from "@/server/auth/session";
import { assertEventInScope } from "@/server/auth/rbac";
import { prisma } from "@/server/db";
import { storage } from "@/server/storage";
import { EventBuilder } from "./event-builder";

export const metadata = { title: "Edit event" };

export default async function EventBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/events/${id}`);
  assertEventInScope(session, id);

  const event = await prisma.event.findFirst({
    where: { id, organisationId: session.membership.organisationId, deletedAt: null },
    include: {
      fields: { orderBy: { order: "asc" } },
      prizes: { orderBy: { order: "asc" } },
    },
  });

  if (!event) notFound();

  const organisation = session.membership.organisation;

  return (
    <EventBuilder
      event={{
        id: event.id,
        name: event.name,
        status: event.status,
        slug: event.slug,
        eventDate: event.eventDate ? event.eventDate.toISOString().slice(0, 10) : null,
        entriesCloseAt: event.entriesCloseAt ? toTime(event.entriesCloseAt) : null,
        drawAt: event.drawAt ? toTime(event.drawAt) : null,
        welcomeMessage: event.welcomeMessage,
        venueLabel: event.venueLabel,
        accentColour: event.accentColour,
        backgroundColour: event.backgroundColour,
        logoKey: event.logoKey,
        fields: event.fields.map((field) => ({
          id: field.id,
          key: field.key,
          label: field.label,
          type: field.type,
          required: field.required,
          options: field.options,
          justification: field.justification,
        })),
        prizes: event.prizes.map((prize) => ({
          id: prize.id,
          name: prize.name,
          meta: prize.meta,
          winnerCount: prize.winnerCount,
        })),
      }}
      organisation={{
        name: organisation.name,
        accentColour: organisation.accentColour,
        logoUrl: organisation.logoKey ? storage.url(organisation.logoKey) : null,
        minimiseByDefault: organisation.minimiseByDefault,
      }}
      logoUrl={event.logoKey ? storage.url(event.logoKey) : null}
    />
  );
}

function toTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
