"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

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
 *
 * When it's a form's submit button, it swaps its icon for a spinner and
 * disables itself while that form is submitting (useFormStatus reads the
 * nearest ancestor <form>, so this is a no-op for the plain onClick buttons
 * — e.g. "edit" — that aren't inside one).
 */
export function IconAction({
  label,
  tone = "muted",
  className,
  children,
  disabled,
  ...props
}: ComponentProps<"button"> & { label: string; tone?: IconActionTone }) {
  const { pending } = useFormStatus();
  const isPending = pending && props.type === "submit";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled || isPending}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors",
        TONE_CLASSES[tone],
        isPending && "opacity-60",
        className,
      )}
      {...props}
    >
      {isPending ? <LoaderCircle className="size-4 animate-spin" /> : children}
    </button>
  );
}

/** Same visual treatment, for a `ConfirmButton` trigger (which renders its own button). */
export function iconActionClasses(tone: IconActionTone = "danger") {
  return cn(
    "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors",
    TONE_CLASSES[tone],
  );
}
