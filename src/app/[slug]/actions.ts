"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { renderConsentText, DEFAULT_CONSENT_TEMPLATE, DEFAULT_CONSENT_VERSION } from "@/server/consent";
import { submitEntry, type EntryValues } from "@/server/entries/submit";

export type EntryFormState = {
  errors?: Record<string, string>;
  message?: string;
};

/** Screen 1d — "Enter raffle". */
export async function enterRaffle(
  slug: string,
  _state: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    include: { fields: { orderBy: { order: "asc" } }, organisation: true },
  });

  if (!event) return { message: "This raffle no longer exists." };

  // A bot filling every field trips this; a person never sees it.
  if ((formData.get("website") as string | null)?.length) {
    redirect(`/${slug}/closed?reason=over`);
  }

  if (formData.get("consent") !== "on") {
    return { errors: { consent: "Tick the box so we can store your details for the raffle" } };
  }

  const values: EntryValues = {};
  for (const field of event.fields) {
    const raw = formData.get(`f_${field.key}`);
    values[field.key] = raw === null ? "" : typeof raw === "string" ? raw : "";
  }

  const consentVersion = await prisma.consentTextVersion.findFirst({
    where: { organisationId: event.organisationId },
    orderBy: { createdAt: "desc" },
  });

  const template = consentVersion?.template ?? DEFAULT_CONSENT_TEMPLATE;
  const retention = event.retentionPeriod ?? event.organisation.retentionPeriod;

  const headerList = await headers();
  const result = await submitEntry({
    event,
    values,
    consentText: renderConsentText(template, event.organisation, retention),
    consentVersion: consentVersion?.version ?? DEFAULT_CONSENT_VERSION,
    marketingOptIn: formData.get("marketing") === "on",
    ip: headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
  });

  if (!result.ok) {
    if (result.reason === "closed") redirect(`/${slug}/closed`);
    if (result.reason === "rate-limited") {
      return { message: "That's a lot of entries from this connection. Give it a minute." };
    }
    return { errors: result.errors };
  }

  // A duplicate is told it is already in, and shown its original entry number
  // rather than a second one.
  redirect(`/${slug}/entry?t=${result.accessToken}${result.duplicate ? "&again=1" : ""}`);
}
