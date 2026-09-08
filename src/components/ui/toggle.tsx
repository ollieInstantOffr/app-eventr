"use client";

import { cn } from "@/lib/cn";

/** The pill toggle used throughout Live draw settings and Privacy & data. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  name,
}: {
  checked: boolean;
  onChange?: (next: boolean) => void;
  label: string;
  description?: string;
  name?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span className="flex-1">
        <span className="block text-[13.5px] font-bold">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[12px] leading-snug text-ink-muted">{description}</span>
        ) : null}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(event) => onChange?.(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "h-6 w-11 rounded-full transition-colors",
            checked ? "bg-violet" : "bg-black/15",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </label>
  );
}
