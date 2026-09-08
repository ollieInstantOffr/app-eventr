"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_FORMAT = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const DISPLAY_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fromKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Monday-first 6-week grid for the given month, including the overflow days either side. */
function buildGrid(monthStart: Date): Date[] {
  const firstWeekday = (monthStart.getDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });
}

/**
 * A calendar dropdown in the app's own glass/violet system, replacing the
 * browser's native date picker — which renders in the OS's own chrome
 * (blue accents, system font) and can't be restyled to match the design.
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Select a date",
  className,
}: {
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? fromKey(value) : null;
  const [viewMonth, setViewMonth] = useState(() => {
    const base = selected ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openPicker() {
    const base = selected ?? new Date();
    setViewMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setOpen(true);
  }

  const today = new Date();
  const grid = buildGrid(viewMonth);

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-field border border-black/8 bg-white px-3.5 text-left text-[14px]",
          "focus:border-violet focus:outline-none",
          selected ? "text-ink" : "text-ink-faint",
        )}
      >
        <span>{selected ? DISPLAY_FORMAT.format(selected) : placeholder}</span>
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-ink-faint">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 3v3M14 3v3M4 8h12M5 5h10a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
          />
        </svg>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="solid-panel absolute left-0 top-[calc(100%+6px)] z-30 w-[300px] p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-[13.5px] font-extrabold">{MONTH_FORMAT.format(viewMonth)}</p>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-secondary hover:bg-black/5"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-secondary hover:bg-black/5"
              >
                ›
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS.map((day, index) => (
              <span key={index} className="text-[11px] font-bold text-ink-faint">
                {day}
              </span>
            ))}

            {grid.map((date) => {
              const inMonth = date.getMonth() === viewMonth.getMonth();
              const isSelected = selected !== null && sameDay(date, selected);
              const isToday = sameDay(date, today);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(toKey(date));
                    setOpen(false);
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold transition-colors",
                    !inMonth && "text-ink-faint/60",
                    inMonth && !isSelected && "text-ink hover:bg-violet-tint",
                    isSelected && "bg-violet text-white",
                    !isSelected && isToday && inMonth && "ring-1 ring-inset ring-violet/50",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-black/6 pt-3">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="text-[12.5px] font-bold text-ink-muted hover:text-ink"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(toKey(today));
                setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setOpen(false);
              }}
              className="text-[12.5px] font-bold text-violet hover:text-violet-hover"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
