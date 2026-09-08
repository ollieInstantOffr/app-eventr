"use client";

import { useEffect, useRef } from "react";

/**
 * Screen 1h. A sample of names on segments, a glass pointer at the top, and
 * an eased spin that lands on the winner's segment.
 *
 * With hundreds of entries the wheel shows a representative sample rather
 * than every name — but the sample always contains the actual winner, and the
 * winner is always the segment the pointer stops on.
 */
const SEGMENTS = 12;

export function Wheel({
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
  const wheel = useRef<SVGGElement>(null);

  // The winner sits at segment 0, and the wheel stops with segment 0 under
  // the pointer.
  const names = [winnerName, ...pool.filter((name) => name !== winnerName)].slice(0, SEGMENTS);
  while (names.length < SEGMENTS) names.push("—");

  const slice = 360 / names.length;

  useEffect(() => {
    const element = wheel.current;
    if (!element) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Land with segment 0's centre at the top (under the pointer).
    const target = 360 * 6 - slice / 2;

    if (reduced) {
      element.style.transform = `rotate(${-slice / 2}deg)`;
      const timer = setTimeout(onSettled, 400);
      return () => clearTimeout(timer);
    }

    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 4);
      element!.style.transform = `rotate(${target * eased}deg)`;

      if (t < 1) frame = requestAnimationFrame(tick);
      else onSettled();
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, slice, onSettled]);

  return (
    <div className="relative">
      <svg viewBox="-160 -160 320 320" className="h-[300px] w-[300px]" role="img" aria-label="Prize wheel">
        <g ref={wheel} style={{ transformOrigin: "0 0" }}>
          {names.map((name, index) => {
            const from = index * slice - 90;
            const to = from + slice;
            const large = slice > 180 ? 1 : 0;
            const x1 = 150 * Math.cos((from * Math.PI) / 180);
            const y1 = 150 * Math.sin((from * Math.PI) / 180);
            const x2 = 150 * Math.cos((to * Math.PI) / 180);
            const y2 = 150 * Math.sin((to * Math.PI) / 180);
            const mid = (from + to) / 2;

            return (
              <g key={`${name}-${index}`}>
                <path
                  d={`M 0 0 L ${x1} ${y1} A 150 150 0 ${large} 1 ${x2} ${y2} Z`}
                  fill={index % 2 === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.62)"}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="1"
                />
                <text
                  x={100 * Math.cos((mid * Math.PI) / 180)}
                  y={100 * Math.sin((mid * Math.PI) / 180)}
                  transform={`rotate(${mid} ${100 * Math.cos((mid * Math.PI) / 180)} ${100 * Math.sin((mid * Math.PI) / 180)})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#1c1a27"
                >
                  {name.length > 14 ? `${name.slice(0, 13)}…` : name}
                </text>
              </g>
            );
          })}
          <circle r="26" fill={accentColour} />
        </g>
      </svg>

      {/* The glass pointer. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[-6px] h-0 w-0 -translate-x-1/2"
        style={{
          borderLeft: "13px solid transparent",
          borderRight: "13px solid transparent",
          borderTop: `24px solid ${accentColour}`,
          filter: "drop-shadow(0 4px 10px rgba(40,30,80,.25))",
        }}
      />
    </div>
  );
}
