"use client";

import { useOptimistic, useTransition } from "react";
import { setDuplicateFlag } from "./actions";

/**
 * Duplicates are flagged automatically but the organiser has the final say —
 * the two people at the stand who share a work phone are not one person.
 */
export function DuplicateToggle({
  entryId,
  isDuplicate,
}: {
  entryId: string;
  isDuplicate: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(isDuplicate);
  const [, start] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          await setDuplicateFlag(entryId, !optimistic);
        })
      }
      className={
        optimistic
          ? "rounded-full bg-peach px-2.5 py-1 text-[11px] font-bold text-peach-ink"
          : "rounded-full bg-black/6 px-2.5 py-1 text-[11px] font-bold text-ink-muted hover:text-ink"
      }
    >
      {optimistic ? "Excluded" : "Eligible"}
    </button>
  );
}
