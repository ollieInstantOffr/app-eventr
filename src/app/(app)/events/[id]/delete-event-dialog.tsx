"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { deleteEventPermanently } from "@/server/events/mutations";

export type DeletionImpact = {
  entryCount: number;
  prizeCount: number;
  winnerCount: number;
  drawCount: number;
  undeliveredWinnerName: string | null;
};

/**
 * Screen 7h. Deleting an event is a real erasure, so the dialog states exactly
 * what disappears, warns by name when a prize hasn't been handed over, and
 * offers the export escape hatch before asking you to type the word.
 */
export function DeleteEventDialog({
  eventId,
  eventName,
  impact,
  onClose,
}: {
  eventId: string;
  eventName: string;
  impact: DeletionImpact;
  onClose: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const lines: Array<{ count: number; label: string }> = [
    { count: impact.entryCount, label: "guest entries with personal data" },
    { count: impact.prizeCount, label: "prizes and winner records" },
    { count: impact.drawCount, label: "draw logs (anonymised copies are kept)" },
    { count: 1, label: "QR code — printed posters stop working" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6 backdrop-blur-sm"
    >
      <div className="glass max-h-full w-full max-w-[480px] overflow-y-auto p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-chip bg-danger/12 text-[22px] font-extrabold text-danger">
          !
        </div>

        <h2 id="delete-title" className="mt-4 text-[20px] font-extrabold">
          Delete &ldquo;{eventName}&rdquo;?
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-secondary">
          This permanently erases the event and everything in it. It cannot be undone, and we cannot
          recover it for you afterwards.
        </p>

        <ul className="mt-5 divide-y divide-black/6">
          {lines.map((line) => (
            <li key={line.label} className="flex items-baseline gap-3 py-2.5">
              <span className="w-10 shrink-0 text-right text-[17px] font-extrabold tabular-nums">
                {line.count}
              </span>
              <span className="text-[12.5px] text-ink-secondary">{line.label}</span>
            </li>
          ))}
        </ul>

        {impact.undeliveredWinnerName ? (
          <p className="mt-4 rounded-field bg-peach px-4 py-3 text-[12.5px] leading-relaxed text-peach-ink">
            A prize hasn&rsquo;t been marked delivered. Deleting removes{" "}
            <strong>{impact.undeliveredWinnerName}</strong>&rsquo;s contact details &mdash; you
            won&rsquo;t be able to reach them.
          </p>
        ) : null}

        <p className="mt-4 text-[12.5px] text-ink-muted">
          <a
            href={`/api/events/${eventId}/entries/export`}
            className="font-bold text-violet hover:text-violet-hover"
          >
            Export entries as CSV first
          </a>{" "}
          if you still need them.
        </p>

        <label className="mt-5 block">
          <span className="text-[12px] font-bold text-ink-muted">
            Type <code className="rounded bg-white px-1 py-0.5 font-mono">delete</code> to confirm
          </span>
          <Input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="delete"
            autoComplete="off"
            className="mt-1.5"
            aria-label="Type delete to confirm"
          />
        </label>

        {error ? <p className="mt-2 text-[12.5px] font-semibold text-danger">{error}</p> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={pending || confirmation.trim().toLowerCase() !== "delete"}
            onClick={() =>
              start(async () => {
                const result = await deleteEventPermanently(eventId, confirmation);
                if (result?.error) setError(result.error);
              })
            }
          >
            {pending ? "Deleting…" : "Delete event permanently"}
          </Button>
        </div>
      </div>
    </div>
  );
}
