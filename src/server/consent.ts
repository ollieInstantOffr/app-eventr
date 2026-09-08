import type { Organisation } from "@/generated/prisma";
import { RetentionPeriod } from "@/generated/prisma";

/**
 * The consent sentence shown above the "Enter raffle" button (screen 4d).
 * Placeholders are filled per event; the resolved text is stored on the entry
 * so a guest's record always shows the exact wording they agreed to.
 */
export const DEFAULT_CONSENT_TEMPLATE =
  "I agree that {{organisation}} stores my details to run this raffle and contact me if I win. " +
  "My details are deleted {{retention}} after the event. Processing is done by instantoffr as a service provider.";

export const DEFAULT_CONSENT_VERSION = "1.0";

export const RETENTION_LABELS: Record<RetentionPeriod, string> = {
  [RetentionPeriod.DAYS_7]: "7 days",
  [RetentionPeriod.DAYS_30]: "30 days",
  [RetentionPeriod.DAYS_90]: "90 days",
  [RetentionPeriod.MONTHS_12]: "12 months",
};

export const RETENTION_DAYS: Record<RetentionPeriod, number> = {
  [RetentionPeriod.DAYS_7]: 7,
  [RetentionPeriod.DAYS_30]: 30,
  [RetentionPeriod.DAYS_90]: 90,
  [RetentionPeriod.MONTHS_12]: 365,
};

export function renderConsentText(
  template: string,
  organisation: Pick<Organisation, "name">,
  retention: RetentionPeriod,
): string {
  return template
    .replaceAll("{{organisation}}", organisation.name)
    .replaceAll("{{retention}}", RETENTION_LABELS[retention]);
}

export const MARKETING_OPT_IN_TEMPLATE = "Send me news from {{organisation}}";

export function renderMarketingOptInText(organisationName: string): string {
  return MARKETING_OPT_IN_TEMPLATE.replaceAll("{{organisation}}", organisationName);
}
