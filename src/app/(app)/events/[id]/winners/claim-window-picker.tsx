"use client";

import { useState, useTransition } from "react";
import { ClaimWindow } from "@/generated/prisma";
import { cn } from "@/lib/cn";
import { setClaimWindow } from "./actions";

const OPTIONS: Array<{ value: ClaimWindow; label: string }> = [
  { value: ClaimWindow.MINUTES_15, label: "15 min" },
  { value: ClaimWindow.HOUR_1, label: "1 h" },
  { value: ClaimWindow.TODAY, label: "Today" },
  { value: ClaimWindow.DAYS_7, label: "7 days" },
];

export function ClaimWindowPicker({ eventId, value }: { eventId: string; value: ClaimWindow }) {
  const [selected, setSelected] = useState(value);
  const [, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected === option.value}
          onClick={() => {
            setSelected(option.value);
            start(() => setClaimWindow(eventId, option.value));
          }}
          className={cn(
            "rounded-field px-3.5 py-2 text-[13px] font-bold transition-colors",
            selected === option.value
              ? "bg-violet text-white"
              : "bg-white text-ink-secondary hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
