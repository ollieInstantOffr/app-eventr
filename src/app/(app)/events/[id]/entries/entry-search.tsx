"use client";

import { Input } from "@/components/ui/field";

/** Search submits as a plain GET, so results are shareable and back works. */
export function EntrySearch({
  defaultValue,
  action,
  filter,
}: {
  defaultValue: string;
  action: string;
  filter: string;
}) {
  return (
    <form action={action} className="flex-1 min-w-[200px]">
      {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search name, email or company"
        aria-label="Search entries"
        className="h-9 text-[13px]"
      />
    </form>
  );
}
