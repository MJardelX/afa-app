import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "accent";
type Size = "sm" | "md" | "lg";

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium " +
  "transition-[background-color,box-shadow,transform] duration-150 " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-55";

const variants: Record<Variant, string> = {
  // --brand is sky-700: 6.11:1 on white, in both themes.
  // It is not lightened in dark because sky-600 drops to 4.27:1 and fails AA.
  primary: "bg-brand text-brand-fg shadow-sm hover:bg-brand-hover",
  secondary:
    "bg-brand-subtle text-brand-legible ring-1 ring-inset ring-line hover:bg-surface-2",
  ghost: "text-brand-legible hover:bg-brand-subtle",
  // Yellow as a surface with dark sky text on top, never the other way round.
  accent: "bg-accent text-accent-fg shadow-sm hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[0.8rem]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-[0.95rem]",
};

/** Compose the button styles onto any element (e.g. a Next <Link>). */
export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props} />
  );
}
