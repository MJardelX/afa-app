import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "good"
  | "warn"
  | "danger"
  | "brand";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-muted ring-1 ring-inset ring-line",
  good: "bg-status-good-bg text-status-good-fg",
  warn: "bg-accent text-accent-fg",
  danger: "bg-danger-bg text-danger",
  brand: "bg-brand-subtle text-brand-legible",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
