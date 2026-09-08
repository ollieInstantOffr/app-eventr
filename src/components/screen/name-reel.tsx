"use client";

import { useEffect, useRef } from "react";

const ROW_HEIGHT = 92;

/**
 * Screen 1g. Names blur past a centre line and decelerate onto the winner.
 *
 * The winner is decided by the server before this runs; the reel only reveals
 * it, so it always lands on the right name — including when the tab was
 * backgrounded mid-spin, because the final position is set from the clock,
 * not accumulated per frame.
 */
export function NameReel({
  pool,
  winnerName,
  durationMs,
  accentColour,
  onSettled,
}: {
  pool: string[];
  winnerName: string;
  durationMs: number;
  accentColour: string;
  onSettled: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);

  // The strip is the pool repeated, with the winner at a known index near the
  // end — so "stopping on the winner" is just scrolling to that offset.
  const loops = 6;
  const strip = Array.from({ length: loops }, () => pool).flat();
  const winnerIndex = strip.length - Math.floor(pool.length / 2);
  const stripWithWinner = [...strip];
  stripWithWinner[winnerIndex] = winnerName;

  useEffect(() => {
    const element = track.current;
    if (!element) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = -(winnerIndex * ROW_HEIGHT);

    if (reduced) {
      element.style.transform = `translate3d(0, ${target}px, 0)`;
      const timer = setTimeout(onSettled, 400);
      return () => clearTimeout(timer);
    }

    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // Quintic ease-out: fast, then a long settle — the suspense is in the tail.
      const eased = 1 - Math.pow(1 - t, 5);
      element!.style.transform = `translate3d(0, ${target * eased}px, 0)`;
      // Motion blur while it's moving fast, gone by the time it stops.
      element!.style.filter = t < 0.85 ? `blur(${(1 - t) * 7}px)` : "none";

      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        onSettled();
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, winnerIndex, onSettled]);

  return (
    <div
      className="relative h-[276px] w-full max-w-[640px] overflow-hidden"
      style={{
        maskImage: "linear-gradient(transparent, black 25%, black 75%, transparent)",
        WebkitMaskImage: "linear-gradient(transparent, black 25%, black 75%, transparent)",
      }}
      aria-live="polite"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 z-10 h-[2px] -translate-y-1/2"
        style={{ background: accentColour }}
      />
      <div ref={track} className="absolute inset-x-0 top-[92px] will-change-transform">
        {stripWithWinner.map((name, index) => (
          <div
            key={`${name}-${index}`}
            className="flex items-center justify-center text-[38px] font-extrabold tracking-[-0.03em]"
            style={{ height: ROW_HEIGHT }}
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}
