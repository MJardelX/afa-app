import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type IconActionTone = "muted" | "danger" | "brand";

const TONE_CLASSES: Record<IconActionTone, string> = {
  muted: "hover:bg-surface-2 hover:text-fg",
  danger: "hover:bg-danger-bg hover:text-danger",
  brand: "hover:bg-brand-subtle hover:text-brand-legible",
};

/**
 * Small icon-only admin action (edit, delete, toggle status...) used across
 * row lists and cards. There's no visible label, so `label` is required and
 * becomes both `title` (hover tooltip) and `aria-label` (accessible name).
 */
export function IconAction({
  label,
  tone = "muted",
  className,
  ...props
}: ComponentProps<"button"> & { label: string; tone?: IconActionTone }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Same visual treatment, for a `ConfirmButton` trigger (which renders its own button). */
export function iconActionClasses(tone: IconActionTone = "danger") {
  return cn(
    "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors",
    TONE_CLASSES[tone],
  );
}
