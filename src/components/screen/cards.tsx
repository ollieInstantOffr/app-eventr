"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The fourth look: a grid of face-down cards flips one by one, and the last
 * one turned is the winner.
 */
const COUNT = 12;

export function Cards({
  durationMs,
  accentColour,
  onSettled,
}: {
  durationMs: number;
  accentColour: string;
  onSettled: () => void;
}) {
  const [flipped, setFlipped] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setFlipped(COUNT);
      const timer = setTimeout(onSettled, 400);
      return () => clearTimeout(timer);
    }

    const step = durationMs / COUNT;
    const timer = setInterval(() => {
      setFlipped((value) => {
        if (value >= COUNT - 1) {
          clearInterval(timer);
          onSettled();
          return COUNT;
        }
        return value + 1;
      });
    }, step);

    return () => clearInterval(timer);
  }, [durationMs, onSettled]);

  return (
    <div className="grid h-[276px] grid-cols-6 grid-rows-2 place-content-center gap-3" aria-hidden>
      {Array.from({ length: COUNT }, (_, index) => (
        <div
          key={index}
          className={cn(
            "h-[120px] w-[86px] rounded-[14px] transition-transform duration-500",
            index < flipped ? "[transform:rotateY(180deg)]" : "",
          )}
          style={{
            background:
              index === COUNT - 1 && flipped >= COUNT
                ? accentColour
                : index < flipped
                  ? "rgba(255,255,255,.95)"
                  : "rgba(255,255,255,.55)",
            transformStyle: "preserve-3d",
          }}
        />
      ))}
    </div>
  );
}
