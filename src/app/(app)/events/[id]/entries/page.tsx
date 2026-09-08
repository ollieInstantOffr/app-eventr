import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatCount, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { prisma } from "@/server/db";
import { canSeePersonalData } from "@/server/auth/rbac";
import { requireEventAccess } from "@/server/events/access";
import { entryCounts, listEntries, PAGE_SIZE, type EntryFilter } from "@/server/entries/queries";
import { EntrySearch } from "./entry-search";
import { DuplicateToggle } from "./duplicate-toggle";

export const metadata = { title: "Entries" };

const FILTERS: Array<{ key: EntryFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "eligible", label: "Eligible" },
  { key: "duplicates", label: "Duplicates" },
  { key: "winners", label: "Winners" },
];

/** Screen 1e. */
export default async function EntriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string; q?: string; page?: string }>;
}) {
  const { id } = await params;
  const { filter: rawFilter, q, page: rawPage } = await searchParams;

  const session = await requireEventAccess(id);
  const event = await prisma.event.findFirst({
    where: { id, organisationId: session.membership.organisationId, deletedAt: null },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!event) notFound();

  const filter = (FILTERS.find((f) => f.key === rawFilter)?.key ?? "all") as EntryFilter;
  const query = q ?? "";
  const page = Math.max(1, Number(rawPage) || 1);

  const [{ entries, total, pageCount }, counts] = await Promise.all([
    listEntries({ eventId: event.id, role: session.role, filter, query, page }),
    entryCounts(event.id),
  ]);

  const showPersonal = canSeePersonalData(session.role);
  const columns = event.fields.filter((field) => showPersonal || field.key === "name");

  const href = (next: Partial<{ filter: string; q: string; page: number }>) => {
    const search = new URLSearchParams();
    const value = { filter, q: query, page: 1, ...next };
    if (value.filter !== "all") search.set("filter", value.filter);
    if (value.q) search.set("q", value.q);
    if (value.page > 1) search.set("page", String(value.page));
    const suffix = search.toString();
    return `/events/${event.id}/entries${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="text-[12.5px] font-bold text-ink-muted">
            <Link href="/events" className="hover:text-violet">
              Events
            </Link>{" "}
            / {event.name}
          </p>
          <h1 className="mt-0.5 text-[28px] font-extrabold">
            {formatCount(counts.all)} {counts.all === 1 ? "entry" : "entries"}
          </h1>
        </div>
        <div className="flex gap-2">
          {showPersonal ? (
            <ButtonLink
              href={`/api/events/${event.id}/entries/export?filter=${filter}`}
              variant="secondary"
              prefetch={false}
            >
              Export CSV
            </ButtonLink>
          ) : null}
          <ButtonLink href={`/events/${event.id}/live`}>Start live draw →</ButtonLink>
        </div>
      </header>

      <GlassPanel className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-black/6 p-4">
          <EntrySearch defaultValue={query} action={`/events/${event.id}/entries`} filter={filter} />

          <nav className="flex flex-wrap gap-1.5">
            {FILTERS.map((option) => {
              const count =
                option.key === "all"
                  ? counts.all
                  : option.key === "eligible"
                    ? counts.eligible
                    : option.key === "duplicates"
                      ? counts.duplicates
                      : counts.winners;

              return (
                <Link
                  key={option.key}
                  href={href({ filter: option.key })}
                  aria-current={filter === option.key ? "true" : undefined}
                  className={cn(
                    "rounded-[10px] px-3 py-1.5 text-[12.5px] font-bold transition-colors",
                    filter === option.key
                      ? "bg-violet text-white"
                      : "bg-white text-ink-secondary hover:text-ink",
                  )}
                >
                  {option.label}
                  {option.key === "all" || count > 0 ? ` · ${formatCount(count)}` : ""}
                </Link>
              );
            })}
          </nav>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <h2 className="text-[17px] font-extrabold">
              {query || filter !== "all" ? "Nothing matches that" : "No entries yet"}
            </h2>
            <p className="max-w-md text-[13px] leading-relaxed text-ink-secondary">
              {query || filter !== "all"
                ? "Try a different search or filter."
                : event.entriesCloseAt
                  ? `The first scan shows up here instantly. Entries close at ${formatTime(event.entriesCloseAt)}.`
                  : "The first scan shows up here instantly."}
            </p>
            {!query && filter === "all" ? (
              <div className="mt-3 flex gap-2">
                <ButtonLink href={`/screen/${event.slug}/qr`} target="_blank" variant="secondary" size="sm">
                  Show QR on this screen
                </ButtonLink>
                <ButtonLink
                  href={`/api/events/${event.id}/poster?size=A4`}
                  variant="secondary"
                  size="sm"
                  prefetch={false}
                >
                  Download poster
                </ButtonLink>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="text-[11.5px] font-bold text-ink-muted">
                  <th scope="col" className="px-4 py-2.5">#</th>
                  {columns.map((field) => (
                    <th key={field.key} scope="col" className="px-4 py-2.5">
                      {field.label}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-2.5">Time</th>
                  {showPersonal ? <th scope="col" className="px-4 py-2.5 text-right">Duplicate</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/6">
                {entries.map((entry) => (
                  <tr key={entry.id} className={cn(entry.isDuplicate && "bg-peach/25")}>
                    <td className="px-4 py-2.5 text-[12.5px] font-bold tabular-nums text-ink-muted">
                      {entry.number}
                    </td>
                    {columns.map((field) => (
                      <td key={field.key} className="px-4 py-2.5 text-[13px]">
                        {cellFor(entry, field.key)}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-[12.5px] text-ink-muted">
                      {formatTime(entry.createdAt)}
                    </td>
                    {showPersonal ? (
                      <td className="px-4 py-2.5 text-right">
                        <DuplicateToggle entryId={entry.id} isDuplicate={entry.isDuplicate} />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {entries.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/6 p-4 text-[12.5px] text-ink-muted">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}&ndash;{(page - 1) * PAGE_SIZE + entries.length} of{" "}
              {formatCount(total)}
            </span>
            <span className="flex gap-2">
              {page > 1 ? (
                <Link href={href({ page: page - 1 })} className="font-bold text-violet hover:text-violet-hover">
                  ← Previous
                </Link>
              ) : null}
              {page < pageCount ? (
                <Link href={href({ page: page + 1 })} className="font-bold text-violet hover:text-violet-hover">
                  Next →
                </Link>
              ) : null}
            </span>
          </div>
        ) : null}

        {counts.duplicates > 0 && showPersonal ? (
          <p className="border-t border-black/6 px-4 py-3 text-[12px] text-ink-muted">
            <Badge tone="warn" className="mr-2">
              Possible duplicate
            </Badge>
            Same email or phone as an earlier entry. Excluded from the draw by default &mdash; toggle
            any row to override.
          </p>
        ) : null}
      </GlassPanel>
    </div>
  );
}

function cellFor(entry: { name: string; email?: string; phone?: string; answers?: Record<string, unknown> }, key: string) {
  if (key === "name") return <span className="font-bold">{entry.name}</span>;
  if (key === "email") return entry.email ?? "—";
  if (key === "phone") return entry.phone ?? "—";
  const value = entry.answers?.[key];
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return typeof value === "string" && value ? value : "—";
}
