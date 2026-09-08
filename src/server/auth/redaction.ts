import type { Role } from "@/generated/prisma";
import { canSeePersonalData } from "@/server/auth/rbac";

/** "Jonas Ek" → "Jonas E." — the masking the live screen and guest views use. */
export function shortenName(name: string | null | undefined): string {
  if (!name) return "Guest";
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "Guest";
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
  return last ? `${first} ${last[0]!.toUpperCase()}.` : first;
}

/** "jonas@ek.se" → "jo···@ek.se", as shown in Live draw settings. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!local || !domain) return "···";
  return `${local.slice(0, 2)}···@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return `···${phone.slice(-4)}`;
}

export type PublicEntry = {
  id: string;
  number: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  answers?: Record<string, unknown>;
  isDuplicate: boolean;
  createdAt: Date;
};

type EntryRow = {
  id: string;
  number: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  data: unknown;
  isDuplicate: boolean;
  createdAt: Date;
};

/**
 * The single place an entry becomes something that can leave the server.
 * A Viewer gets counts and shortened names; nobody else's raw data ever
 * reaches a role that may not see it.
 */
export function toPublicEntry(entry: EntryRow, role: Role): PublicEntry {
  if (!canSeePersonalData(role)) {
    return {
      id: entry.id,
      number: entry.number,
      name: shortenName(entry.name),
      isDuplicate: entry.isDuplicate,
      createdAt: entry.createdAt,
    };
  }

  const data = (entry.data ?? {}) as Record<string, unknown>;
  return {
    id: entry.id,
    number: entry.number,
    name: entry.name ?? "",
    email: entry.email ?? undefined,
    phone: entry.phone ?? undefined,
    company: typeof data.company === "string" ? data.company : undefined,
    answers: data,
    isDuplicate: entry.isDuplicate,
    createdAt: entry.createdAt,
  };
}

/** What the audience is allowed to see on the big screen. */
export function toScreenName(name: string | null, mask: boolean): string {
  return mask ? shortenName(name) : (name ?? "Guest");
}
