import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-field border border-black/8 bg-white px-3.5 text-[14px] text-ink " +
  "placeholder:text-ink-faint focus:border-violet focus:outline-none";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[12px] font-bold text-ink-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] font-semibold text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: React.ComponentPropsWithoutRef<"input">) {
  return <input className={cn(CONTROL, "h-11", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: React.ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={cn(CONTROL, "min-h-24 py-2.5 leading-relaxed", className)} {...rest} />;
}

export function Select({ className, ...rest }: React.ComponentPropsWithoutRef<"select">) {
  return <select className={cn(CONTROL, "h-11 pr-8", className)} {...rest} />;
}
