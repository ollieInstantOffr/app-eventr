"use client";

import { useEffect, useRef } from "react";

/**
 * Confetti on a canvas — cheap enough to stay at 60fps on the tired laptop
 * that is actually driving the projector. Honours prefers-reduced-motion by
 * simply not running.
 */
export function Confetti({ colours, active }: { colours: string[]; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const element = canvas.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = element.getContext("2d");
    if (!context) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    element.width = element.clientWidth * dpr;
    element.height = element.clientHeight * dpr;
    context.scale(dpr, dpr);

    const width = element.clientWidth;
    const height = element.clientHeight;

    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.5,
      size: 6 + Math.random() * 7,
      speed: 2 + Math.random() * 3.5,
      drift: (Math.random() - 0.5) * 1.6,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.2,
      colour: colours[Math.floor(Math.random() * colours.length)]!,
    }));

    let frame = 0;
    const started = performance.now();

    function tick(now: number) {
      context!.clearRect(0, 0, width, height);
      const elapsed = now - started;
      // Fade out over the last second rather than vanishing.
      const alpha = elapsed > 5000 ? Math.max(0, 1 - (elapsed - 5000) / 1000) : 1;
      context!.globalAlpha = alpha;

      for (const piece of pieces) {
        piece.y += piece.speed;
        piece.x += piece.drift;
        piece.rotation += piece.spin;
        if (piece.y > height + 20) piece.y = -20;

        context!.save();
        context!.translate(piece.x, piece.y);
        context!.rotate(piece.rotation);
        context!.fillStyle = piece.colour;
        context!.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
        context!.restore();
      }

      if (elapsed < 6000) frame = requestAnimationFrame(tick);
      else context!.clearRect(0, 0, width, height);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, colours]);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
