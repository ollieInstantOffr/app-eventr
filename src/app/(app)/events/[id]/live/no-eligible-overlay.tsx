"use client";

import { Button } from "@/components/ui/button";

/**
 * Screen 7f. Shown only to the organiser: the audience keeps looking at the
 * waiting screen, because the rule is that the room never sees an error.
 */
export function NoEligibleEntriesOverlay({
  prizeName,
  prizeOrder,
  onAllowPreviousWinners,
  onIncludeDuplicates,
  onDismiss,
}: {
  prizeName: string;
  prizeOrder: number;
  onAllowPreviousWinners: () => void;
  onIncludeDuplicates: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="no-eligible-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6 backdrop-blur-sm"
    >
      <div className="glass w-full max-w-[440px] p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-chip bg-peach text-[22px] font-extrabold text-peach-ink">
          !
        </div>

        <h2 id="no-eligible-title" className="mt-4 text-[20px] font-extrabold">
          No eligible entries for prize {prizeOrder}
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-secondary">
          Everyone has either won already or is flagged as a duplicate. Shown only to you &mdash; the
          audience sees the waiting screen.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Button variant="secondary" onClick={onAllowPreviousWinners}>
            Allow previous winners
          </Button>
          <Button variant="secondary" onClick={onIncludeDuplicates}>
            Include duplicates
          </Button>
          <Button variant="ghost" onClick={onDismiss}>
            Skip {prizeName}
          </Button>
        </div>
      </div>
    </div>
  );
}
