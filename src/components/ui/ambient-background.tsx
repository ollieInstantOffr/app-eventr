import { cn } from "@/lib/cn";

/**
 * The soft violet and teal light that sits behind every frosted panel in the
 * design. Purely decorative, so it is hidden from assistive technology.
 *
 * Fixed to the viewport rather than absolutely positioned in the page flow:
 * an absolute blob scrolls with the document, which forces the browser to
 * recomposite its 70px blur on every scroll frame — the single biggest
 * source of scroll jank in the app. Pinned to the viewport, it paints once
 * and the page scrolls over it.
 */
export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 overflow-hidden", className)}
    >
      <div className="blob -top-32 -left-24 h-[420px] w-[420px] bg-violet-blob" />
      <div className="blob -bottom-40 -right-24 h-[360px] w-[360px] bg-teal-blob" />
      <div className="blob top-1/3 left-1/2 h-[280px] w-[280px] -translate-x-1/2 bg-peach opacity-50" />
    </div>
  );
}
