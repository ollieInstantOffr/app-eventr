"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { EventStatus, FieldType, Prisma } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { assertCan, assertEventInScope } from "@/server/auth/rbac";
import { defaultFields } from "@/server/events/defaults";
import { isReserved, slugify, suggestSlug } from "@/lib/slug";
import { storeUpload, UploadError } from "@/server/storage";

export type EventFormState = { error?: string; savedAt?: string };

const fieldSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1).max(40),
  label: z.string().trim().min(1, "Every field needs a label").max(120),
  type: z.nativeEnum(FieldType),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1)).default([]),
  justification: z.string().trim().max(280).nullable().default(null),
});

const prizeSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Every prize needs a name").max(160),
  meta: z.string().trim().max(160).nullable().default(null),
  winnerCount: z.number().int().min(1).max(100),
});

const eventSchema = z.object({
  name: z.string().trim().min(1, "Give the event a name").max(160),
  eventDate: z.string().nullable(),
  entriesCloseAt: z.string().nullable(),
  drawAt: z.string().nullable(),
  welcomeMessage: z.string().trim().max(600).nullable(),
  venueLabel: z.string().trim().max(120).nullable(),
  accentColour: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
  backgroundColour: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
  logoKey: z.string().nullable(),
  fields: z.array(fieldSchema).min(1, "Keep at least one field on the entry form"),
  prizes: z.array(prizeSchema),
});

export type EventDraft = z.infer<typeof eventSchema>;

/** Combines a date and a "HH:mm" time into an instant. */
function combine(date: string | null, time: string | null): Date | null {
  if (!date) return null;
  const iso = time ? `${date}T${time}:00` : `${date}T00:00:00`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Creates a draft event with the organisation's defaults already applied. */
export async function createEvent(): Promise<never> {
  const session = await requireSession();
  assertCan(session, "event:write");

  const organisation = session.membership.organisation;
  const seeds = defaultFields(organisation.minimiseByDefault);

  const event = await prisma.event.create({
    data: {
      organisationId: organisation.id,
      name: "",
      slug: await uniqueSlug("event"),
      status: EventStatus.DRAFT,
      maskPersonalData: organisation.maskNamesOnScreen,
      fields: {
        create: seeds.map((field) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          required: field.required,
          order: field.order,
          options: field.options ?? [],
        })),
      },
    },
  });

  redirect(`/events/${event.id}`);
}

async function uniqueSlug(base: string): Promise<string> {
  const stem = slugify(base) || "event";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? stem : `${stem}-${attempt + 1}`;
    if (isReserved(candidate)) continue;
    const clash = await prisma.event.findUnique({ where: { slug: candidate } });
    if (!clash) return candidate;
  }
  return `${stem}-${Date.now().toString(36)}`;
}

async function loadEditableEvent(eventId: string) {
  const session = await requireSession();
  assertCan(session, "event:write");
  assertEventInScope(session, eventId);

  const event = await prisma.event.findFirst({
    where: { id: eventId, organisationId: session.membership.organisationId, deletedAt: null },
  });
  if (!event) throw new Error("Event not found");

  return { session, event };
}

/** Saves the whole builder in one transaction — details, branding, fields, prizes. */
export async function saveEvent(eventId: string, draft: EventDraft): Promise<EventFormState> {
  const { event } = await loadEditableEvent(eventId);

  const parsed = eventSchema.safeParse(draft);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }
  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: event.id },
      data: {
        name: data.name,
        eventDate: data.eventDate ? new Date(`${data.eventDate}T00:00:00`) : null,
        entriesCloseAt: combine(data.eventDate, data.entriesCloseAt),
        drawAt: combine(data.eventDate, data.drawAt),
        welcomeMessage: data.welcomeMessage,
        venueLabel: data.venueLabel,
        accentColour: data.accentColour,
        backgroundColour: data.backgroundColour,
        logoKey: data.logoKey,
      },
    });

    // Fields and prizes are small ordered lists the organiser reorders freely,
    // so they are replaced wholesale rather than diffed — but rows that
    // already exist keep their id, because entries reference field keys and
    // winners reference prize ids.
    const keptFieldIds = data.fields.map((field) => field.id).filter(Boolean) as string[];
    await tx.formField.deleteMany({
      where: { eventId: event.id, ...(keptFieldIds.length ? { id: { notIn: keptFieldIds } } : {}) },
    });

    for (const [index, field] of data.fields.entries()) {
      const payload = {
        label: field.label,
        type: field.type,
        required: field.required,
        order: index,
        options: field.options,
        justification: field.justification,
      };
      if (field.id) {
        await tx.formField.update({ where: { id: field.id }, data: payload });
      } else {
        await tx.formField.create({ data: { ...payload, eventId: event.id, key: field.key } });
      }
    }

    const keptPrizeIds = data.prizes.map((prize) => prize.id).filter(Boolean) as string[];
    await tx.prize.deleteMany({
      where: { eventId: event.id, ...(keptPrizeIds.length ? { id: { notIn: keptPrizeIds } } : {}) },
    });

    for (const [index, prize] of data.prizes.entries()) {
      const payload = {
        name: prize.name,
        meta: prize.meta,
        winnerCount: prize.winnerCount,
        order: index,
      };
      if (prize.id) {
        await tx.prize.update({ where: { id: prize.id }, data: payload });
      } else {
        await tx.prize.create({ data: { ...payload, eventId: event.id } });
      }
    }
  });

  revalidatePath(`/events/${event.id}`);
  revalidatePath("/events");
  return { savedAt: new Date().toISOString() };
}

/**
 * Publishing assigns the slug and freezes it: the QR goes on printed posters,
 * so the URL must never change afterwards.
 */
export async function publishEvent(eventId: string, draft: EventDraft): Promise<EventFormState> {
  const saved = await saveEvent(eventId, draft);
  if (saved.error) return saved;

  const { event } = await loadEditableEvent(eventId);

  const [prizeCount, fieldCount] = await Promise.all([
    prisma.prize.count({ where: { eventId: event.id } }),
    prisma.formField.count({ where: { eventId: event.id } }),
  ]);

  if (!draft.name.trim()) return { error: "Give the event a name before publishing" };
  if (prizeCount === 0) return { error: "Add at least one prize before publishing" };
  if (fieldCount === 0) return { error: "The entry form needs at least one field" };

  const closeAt = combine(draft.eventDate, draft.entriesCloseAt);
  if (closeAt && closeAt.getTime() <= Date.now()) {
    return { error: "Entries close in the past — pick a later date or time" };
  }

  if (event.status === EventStatus.DRAFT) {
    await prisma.event.update({
      where: { id: event.id },
      data: {
        status: EventStatus.PUBLISHED,
        publishedAt: new Date(),
        slug: await uniqueSlug(suggestSlug(draft.name, closeAt ?? new Date())),
      },
    });
  }

  revalidatePath("/events");
  redirect(`/events/${event.id}/share`);
}

/** Logo upload from the builder's branding panel. */
export async function uploadEventLogo(
  _state: { error?: string; key?: string },
  formData: FormData,
): Promise<{ error?: string; key?: string }> {
  await requireSession();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "Pick a file first" };

  try {
    const stored = await storeUpload(file);
    return { key: stored.key };
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }
}

/** Loads a demo event with 40 fake entries — the "Try it with sample data" card. */
export async function loadDemoData(): Promise<never> {
  const session = await requireSession();
  assertCan(session, "event:write");

  const { seedDemoEvent } = await import("@/server/events/demo");
  const event = await seedDemoEvent(session.membership.organisationId);

  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}

export async function deleteEventPermanently(
  eventId: string,
  confirmation: string,
): Promise<{ error?: string }> {
  const session = await requireSession();
  assertCan(session, "event:delete");
  assertEventInScope(session, eventId);

  if (confirmation.trim().toLowerCase() !== "delete") {
    return { error: 'Type "delete" to confirm' };
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, organisationId: session.membership.organisationId },
  });
  if (!event) return { error: "Event not found" };

  await prisma.$transaction(async (tx) => {
    // The draw log survives as an anonymised record — the delete dialog says
    // so explicitly, and the organiser needs it for their own accountability.
    await tx.drawLog.updateMany({
      where: { eventId: event.id },
      data: { selectedEntryId: null, triggeredByUserId: null },
    });

    await tx.auditLog.create({
      data: {
        organisationId: session.membership.organisationId,
        userId: session.user.id,
        action: "event.deleted",
        targetType: "event",
        targetId: event.id,
        detail: { name: event.name, slug: event.slug } as Prisma.InputJsonValue,
      },
    });

    await tx.event.delete({ where: { id: event.id } });
  });

  revalidatePath("/events");
  redirect("/events");
}
