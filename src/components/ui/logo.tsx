import { cn } from "@/lib/cn";

/**
 * The mark from the design: a lowercase "e" on the violet-to-teal gradient
 * tile, with the Manrope 800 wordmark and the "by instantoffr" line.
 */
export function Logo({
  size = "md",
  showWordmark = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}) {
  const tile = {
    sm: "h-7 w-7 rounded-[7px] text-[17px]",
    md: "h-[34px] w-[34px] rounded-[9px] text-[22px]",
    lg: "h-11 w-11 rounded-xl text-[28px]",
  }[size];

  const word = { sm: "text-[14px]", md: "text-[17px]", lg: "text-[21px]" }[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-violet-light to-teal font-extrabold leading-none text-white",
          tile,
        )}
      >
        e
      </span>
      {showWordmark ? (
        <span className="leading-[1.1]">
          <span className={cn("block font-extrabold tracking-[-0.02em]", word)}>Eventr</span>
          <span className="block text-[10px] font-bold text-ink-muted">by instantoffr</span>
        </span>
      ) : (
        <span className="sr-only">Eventr by instantoffr</span>
      )}
    </span>
  );
}
