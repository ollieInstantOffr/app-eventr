import "server-only";
import { Prisma, type Event, type FormField, FieldType } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { publishLive } from "@/server/events/channel";
import { rateLimit } from "@/server/auth/rate-limit";

export type EntryValues = Record<string, string | boolean>;

export type SubmitResult =
  | { ok: true; entryId: string; number: number; accessToken: string; duplicate: boolean }
  | { ok: false; reason: "closed" | "rate-limited" | "invalid"; errors?: Record<string, string> };

/** Emails and phones are compared normalised, so casing and spacing don't hide a duplicate. */
export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalisePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

export function validateEntry(
  fields: FormField[],
  values: EntryValues,
): { errors: Record<string, string>; clean: EntryValues } {
  const errors: Record<string, string> = {};
  const clean: EntryValues = {};

  for (const field of fields) {
    const raw = values[field.key];
    const value = typeof raw === "string" ? raw.trim() : raw;

    if (field.type === FieldType.CHECKBOX) {
      const checked = value === true || value === "on" || value === "true";
      if (field.required && !checked) errors[field.key] = `${field.label} is required`;
      clean[field.key] = checked;
      continue;
    }

    const text = typeof value === "string" ? value : "";

    if (!text) {
      if (field.required) errors[field.key] = `${field.label} is required`;
      continue;
    }

    if (text.length > 320) {
      errors[field.key] = `${field.label} is too long`;
      continue;
    }

    if (field.type === FieldType.EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) {
      errors[field.key] = "That email address doesn't look right";
      continue;
    }

    if (field.type === FieldType.PHONE && normalisePhone(text).replace(/\D/g, "").length < 6) {
      errors[field.key] = "That phone number doesn't look right";
      continue;
    }

    if (field.type === FieldType.CHOICE && field.options.length > 0 && !field.options.includes(text)) {
      errors[field.key] = "Pick one of the options";
      continue;
    }

    clean[field.key] = text;
  }

  return { errors, clean };
}

export function entriesOpen(event: Pick<Event, "status" | "entriesCloseAt">): boolean {
  if (event.status !== "PUBLISHED") return false;
  if (event.entriesCloseAt && event.entriesCloseAt.getTime() <= Date.now()) return false;
  return true;
}

/**
 * Creates one entry. Duplicates are flagged rather than rejected — the
 * organiser decides what to do with them — and the exact consent wording,
 * version and moment are stored on the row.
 */
export async function submitEntry(options: {
  event: Event & { fields: FormField[] };
  values: EntryValues;
  consentText: string;
  consentVersion: string;
  marketingOptIn: boolean;
  ip: string;
}): Promise<SubmitResult> {
  const { event } = options;

  if (!entriesOpen(event)) return { ok: false, reason: "closed" };

  // Enough headroom for a queue at a busy stand, tight enough to stop a script.
  const perIp = rateLimit(`entry:${event.id}:${options.ip}`, 8, 10 * 60 * 1000);
  if (!perIp.allowed) return { ok: false, reason: "rate-limited" };

  const { errors, clean } = validateEntry(event.fields, options.values);
  if (Object.keys(errors).length > 0) return { ok: false, reason: "invalid", errors };

  const email = typeof clean.email === "string" ? normaliseEmail(clean.email) : null;
  const phone = typeof clean.phone === "string" ? normalisePhone(clean.phone) : null;
  const name = typeof clean.name === "string" ? clean.name : null;

  // Same email or phone as an existing entry — flagged, and excluded from the
  // draw by default.
  const existing =
    email || phone
      ? await prisma.entry.findFirst({
          where: {
            eventId: event.id,
            erasedAt: null,
            OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
          },
          orderBy: { createdAt: "asc" },
          select: { id: true, number: true, accessToken: true },
        })
      : null;

  const entry = await prisma.$transaction(async (tx) => {
    // Allocating the number inside the transaction keeps them unique even when
    // two people submit at the same instant.
    const updated = await tx.event.update({
      where: { id: event.id },
      data: { nextEntryNumber: { increment: 1 } },
      select: { nextEntryNumber: true },
    });
    const number = updated.nextEntryNumber - 1;

    return tx.entry.create({
      data: {
        eventId: event.id,
        number,
        data: clean as Prisma.InputJsonValue,
        email,
        phone,
        name,
        isDuplicate: existing !== null,
        duplicateOfId: existing?.id ?? null,
        consentText: options.consentText,
        consentVersion: options.consentVersion,
        consentedAt: new Date(),
        marketingOptIn: options.marketingOptIn,
      },
      select: { id: true, number: true, accessToken: true },
    });
  });

  const count = await prisma.entry.count({ where: { eventId: event.id, erasedAt: null } });
  publishLive(event.id, { type: "entry", count });

  return {
    ok: true,
    entryId: entry.id,
    number: entry.number,
    accessToken: entry.accessToken,
    duplicate: existing !== null,
  };
}
