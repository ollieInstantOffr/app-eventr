"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";

export type BuilderPrize = {
  id?: string;
  name: string;
  meta: string | null;
  winnerCount: number;
};

/**
 * Screen 1b's "Prizes · Drawn in this order". This order is the draw order:
 * Space on the public screen draws the next one down.
 */
export function PrizeList({
  prizes,
  onChange,
}: {
  prizes: BuilderPrize[];
  onChange: (prizes: BuilderPrize[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (to < 0 || to >= prizes.length || from === to) return;
    const next = [...prizes];
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    onChange(next);
  }

  function patch(index: number, changes: Partial<BuilderPrize>) {
    onChange(prizes.map((prize, i) => (i === index ? { ...prize, ...changes } : prize)));
  }

  return (
    <div className="flex flex-col gap-2">
      {prizes.length === 0 ? (
        <p className="rounded-field bg-white px-3.5 py-4 text-[12.5px] text-ink-muted">
          No prizes yet. An event needs at least one before you can publish it.
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {prizes.map((prize, index) => (
          <li
            key={prize.id ?? index}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) move(dragIndex, index);
              setDragIndex(null);
            }}
            className={cn(
              "flex items-start gap-2.5 rounded-field bg-white p-3",
              dragIndex === index && "opacity-60 shadow-lift",
            )}
          >
            <span
              aria-hidden
              className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-tint text-[11px] font-extrabold text-violet-deep"
            >
              {index + 1}
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Input
                aria-label={`Prize ${index + 1} name`}
                value={prize.name}
                placeholder='MacBook Air 13"'
                onChange={(e) => patch(index, { name: e.target.value })}
                className="h-9 text-[13px] font-bold"
              />
              <div className="flex gap-2">
                <Input
                  aria-label={`Prize ${index + 1} description`}
                  value={prize.meta ?? ""}
                  placeholder="M4 · 16 GB"
                  onChange={(e) => patch(index, { meta: e.target.value || null })}
                  className="h-8 flex-1 text-[12px]"
                />
                <label className="flex shrink-0 items-center gap-1.5 text-[11.5px] font-bold text-ink-muted">
                  <Input
                    aria-label={`Winners for prize ${index + 1}`}
                    type="number"
                    min={1}
                    max={100}
                    value={prize.winnerCount}
                    onChange={(e) =>
                      patch(index, { winnerCount: Math.max(1, Number(e.target.value) || 1) })
                    }
                    className="h-8 w-14 px-2 text-center text-[12px]"
                  />
                  winner{prize.winnerCount === 1 ? "" : "s"}
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onChange(prizes.filter((_, i) => i !== index))}
              aria-label={`Remove prize ${index + 1}`}
              className="mt-1.5 shrink-0 rounded px-1.5 text-[15px] leading-none text-ink-faint hover:text-danger"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => onChange([...prizes, { name: "", meta: null, winnerCount: 1 }])}
      >
        + Add prize
      </Button>
    </div>
  );
}
