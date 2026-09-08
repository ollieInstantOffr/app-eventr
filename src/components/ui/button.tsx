import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-violet text-white hover:bg-violet-hover shadow-lift",
  secondary: "bg-white text-ink border border-black/8 hover:bg-paper",
  ghost: "text-ink-secondary hover:bg-black/5",
  danger: "bg-danger text-white hover:brightness-95",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[12.5px] rounded-[10px]",
  md: "h-10 px-4 text-[13.5px] rounded-field",
  lg: "h-12 px-6 text-[15px] rounded-[14px]",
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-bold transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...rest} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: React.ComponentPropsWithoutRef<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
