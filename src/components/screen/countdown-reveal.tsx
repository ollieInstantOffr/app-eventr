"use client";

import { useEffect, useState } from "react";

/**
 * Screen 1i. A large numeral counts down, then the name fades in — the calm
 * option for a room where the reel would be too much.
 */
export function CountdownReveal({
  durationMs,
  accentColour,
  onSettled,
}: {
  durationMs: number;
  accentColour: string;
  onSettled: () => void;
}) {
  const steps = Math.max(3, Math.min(5, Math.round(durationMs / 1000)));
  const [remaining, setRemaining] = useState(steps);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const timer = setTimeout(onSettled, 400);
      return () => clearTimeout(timer);
    }

    const interval = durationMs / steps;
    const timer = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          clearInterval(timer);
          onSettled();
          return 0;
        }
        return value - 1;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [durationMs, steps, onSettled]);

  return (
    <div className="flex h-[276px] items-center justify-center" aria-live="polite">
      <span
        key={remaining}
        className="text-[170px] font-extrabold leading-none tabular-nums"
        style={{ color: accentColour, animation: "eventr-pop 700ms ease-out" }}
      >
        {remaining}
      </span>
    </div>
  );
}
