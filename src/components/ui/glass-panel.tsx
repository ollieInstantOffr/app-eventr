import { cn } from "@/lib/cn";

/** The frosted white panel every organiser screen is built from. */
export function GlassPanel({
  as: Tag = "section",
  className,
  children,
  ...rest
}: React.ComponentPropsWithoutRef<"section"> & { as?: "section" | "div" | "aside" | "article" }) {
  return (
    <Tag className={cn("glass p-6", className)} {...rest}>
      {children}
    </Tag>
  );
}

/** A titled panel — the pattern used by Details, Prizes, Retention and friends. */
export function PanelSection({
  title,
  hint,
  action,
  className,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <GlassPanel className={className}>
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-extrabold">{title}</h2>
          {hint ? <p className="mt-0.5 text-[12px] text-ink-muted">{hint}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </GlassPanel>
  );
}
