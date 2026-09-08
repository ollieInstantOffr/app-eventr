"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const STEP_MINUTES = 15;

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeOptions(): string[] {
  const options: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += STEP_MINUTES) {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    options.push(`${h}:${m}`);
  }
  return options;
}

const OPTIONS = timeOptions();

/**
 * A time dropdown in the app's own glass/violet system, replacing the
 * browser's native time picker (which renders in OS chrome and can't be
 * restyled). Typing still works for a time off the 15-minute grid — the list
 * is a shortcut, not the only way in.
 */
export function TimePicker({
  id,
  value,
  onChange,
  placeholder = "--:--",
  className,
}: {
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(value ?? ""), [value]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) {
        setOpen(false);
        commit(draft);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft]);

  useEffect(() => {
    if (!open) return;
    const target = list.current?.querySelector<HTMLElement>('[data-selected="true"]');
    target?.scrollIntoView({ block: "center" });
  }, [open]);

  function commit(next: string) {
    const trimmed = next.trim();
    if (trimmed === "") {
      onChange(null);
      return;
    }
    if (isValidTime(trimmed)) onChange(trimmed);
    else setDraft(value ?? "");
  }

  return (
    <div ref={root} className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-field border border-black/8 bg-white px-3.5",
          "focus-within:border-violet",
        )}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={draft}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commit(draft);
              setOpen(false);
              event.currentTarget.blur();
            }
          }}
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
        />
        <button
          type="button"
          aria-label="Choose a time"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 text-ink-faint"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4">
            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M10 6.5V10l2.5 1.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {open ? (
        <div
          role="listbox"
          aria-label="Time"
          ref={list}
          className="solid-panel absolute left-0 top-[calc(100%+6px)] z-30 max-h-[220px] w-[140px] overflow-y-auto p-1.5"
        >
          {OPTIONS.map((time) => {
            const isSelected = time === value;
            return (
              <button
                key={time}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                onClick={() => {
                  setDraft(time);
                  onChange(time);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full rounded-lg px-3 py-1.5 text-left text-[13px] font-bold tabular-nums transition-colors",
                  isSelected ? "bg-violet text-white" : "text-ink-secondary hover:bg-violet-tint",
                )}
              >
                {time}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
