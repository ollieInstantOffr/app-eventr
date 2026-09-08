import { cn } from "@/lib/cn";

/**
 * Draws the QR from its module matrix rather than an image, so it inherits
 * the event's colours and stays sharp at any size — including on the booth
 * screen, where it may be two feet across.
 */
export function QrCode({
  matrix,
  className,
  dark = "#1c1a27",
  light = "#ffffff",
  label,
}: {
  matrix: boolean[][];
  className?: string;
  dark?: string;
  light?: string;
  label: string;
}) {
  const size = matrix.length;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={cn("h-auto w-full", className)}
    >
      <rect width={size} height={size} fill={light} />
      {matrix.map((row, y) =>
        row.map((filled, x) =>
          filled ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={dark} /> : null,
        ),
      )}
    </svg>
  );
}
