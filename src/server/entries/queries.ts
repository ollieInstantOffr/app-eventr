import "server-only";
import type { Prisma, Role } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { toPublicEntry, type PublicEntry } from "@/server/auth/redaction";

export type EntryFilter = "all" | "eligible" | "duplicates" | "winners";

export const PAGE_SIZE = 25;

function filterWhere(eventId: string, filter: EntryFilter): Prisma.EntryWhereInput {
  const base: Prisma.EntryWhereInput = { eventId, erasedAt: null };

  switch (filter) {
    case "eligible":
      // What the draw would actually pick from: not a duplicate, not already
      // a winner.
      return { ...base, isDuplicate: false, winner: null };
    case "duplicates":
      return { ...base, isDuplicate: true };
    case "winners":
      return { ...base, winner: { isNot: null } };
    default:
      return base;
  }
}

/** Search across name, email and company, as screen 1e's search box promises. */
function searchWhere(query: string): Prisma.EntryWhereInput {
  const term = query.trim();
  if (!term) return {};
  return {
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { data: { path: ["company"], string_contains: term } },
    ],
  };
}

export async function listEntries(options: {
  eventId: string;
  role: Role;
  filter: EntryFilter;
  query: string;
  page: number;
}): Promise<{ entries: PublicEntry[]; total: number; page: number; pageCount: number }> {
  const where: Prisma.EntryWhereInput = {
    ...filterWhere(options.eventId, options.filter),
    ...searchWhere(options.query),
  };

  const [rows, total] = await Promise.all([
    prisma.entry.findMany({
      where,
      orderBy: { number: "desc" },
      skip: (options.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        number: true,
        name: true,
        email: true,
        phone: true,
        data: true,
        isDuplicate: true,
        createdAt: true,
      },
    }),
    prisma.entry.count({ where }),
  ]);

  return {
    // Redaction happens here, not in the table: a Viewer's response must not
    // contain personal data at all.
    entries: rows.map((row) => toPublicEntry(row, options.role)),
    total,
    page: options.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** The counts beside the All / Eligible / Duplicates / Winners tabs. */
export async function entryCounts(eventId: string) {
  const [all, duplicates, winners] = await Promise.all([
    prisma.entry.count({ where: { eventId, erasedAt: null } }),
    prisma.entry.count({ where: { eventId, erasedAt: null, isDuplicate: true } }),
    prisma.entry.count({ where: { eventId, erasedAt: null, winner: { isNot: null } } }),
  ]);

  return { all, duplicates, winners, eligible: all - duplicates - winners };
}
