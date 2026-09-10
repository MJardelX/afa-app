"use client";

import type { ComponentProps, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Form field primitives on solid surfaces (not glass — that's for floating
 * layers). Everything is driven by the theme tokens so it tracks light/dark.
 *
 * A control always carries a >=3:1 outline (`--control-border`) so it never
 * reads as a disabled block or a loading skeleton. There is no focus ring or
 * outline halo: focus just firms up the control's own border (brand colour +
 * a flush inset line so it reads as a crisp 2px edge, not a second ring), and
 * it tints the label + guide icon. Invalid swaps the border for `--danger`.
 */
export const controlClass = cn(
  "h-[2.875rem] w-full rounded-[0.625rem] border border-control-border bg-surface px-3.5 text-[0.9375rem] text-fg",
  "placeholder:text-faint",
  "transition-[border-color,box-shadow,background-color] duration-150",
  "hover:border-fg-faint",
  "focus:border-brand focus:shadow-[inset_0_0_0_1px_var(--brand)] focus:outline-none! focus-visible:outline-none!",
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-faint disabled:shadow-none disabled:hover:border-line",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:shadow-none",
  "aria-[invalid=true]:focus:border-danger aria-[invalid=true]:focus:shadow-[inset_0_0_0_1px_var(--danger)]",
);

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  optional,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  /** Accepted for semantics; no longer drawn (§6.5 — mark the exception). */
  required?: boolean;
  /** Renders a muted "(optional)" next to the label. */
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations("common");
  void required;

  return (
    <div className={cn("group space-y-[7px]", className)}>
      <label
        htmlFor={htmlFor}
        className={cn(
          "flex items-baseline gap-1.5 text-[0.8125rem] font-semibold transition-colors",
          error ? "text-danger" : "text-fg group-focus-within:text-brand-legible",
        )}
      >
        {label}
        {optional && (
          <span className="text-[0.8125rem] font-normal text-muted">
            ({t("optional")})
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-xs leading-[1.4] text-danger"
        >
          <TriangleAlert className="size-3.5 shrink-0" strokeWidth={2.2} />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-[1.4] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className,
  invalid,
  icon,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean; icon?: ReactNode }) {
  const input = (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlClass, Boolean(icon) && "pl-11", className)}
      {...props}
    />
  );

  if (!icon) return input;

  return (
    <div className="relative">
      <span
        className={cn(
          "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors [&_svg]:size-[18px]",
          invalid
            ? "text-danger"
            : "text-faint group-focus-within:text-brand-legible",
        )}
      >
        {icon}
      </span>
      {input}
    </div>
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        controlClass,
        "h-auto min-h-20 resize-y py-2.5 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(controlClass, "cursor-pointer appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 fill-none stroke-muted stroke-[1.6]"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 8 4 4 4-4" />
      </svg>
    </div>
  );
}

export function Checkbox({
  label,
  hint,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 text-sm select-none",
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-line text-brand transition-colors focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:ring-offset-1 focus-visible:ring-offset-canvas"
        {...props}
      />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}
