import { cn } from "@/lib/cn";

type Tone = "neutral" | "violet" | "live" | "warn" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-black/6 text-ink-secondary",
  violet: "bg-violet-tint text-violet-deep",
  live: "bg-teal/15 text-teal-darker",
  warn: "bg-peach text-peach-ink",
  danger: "bg-danger/12 text-danger",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        TONES[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
