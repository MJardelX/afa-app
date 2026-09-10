import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A solid panel that sits a hair off the canvas and separates by its `--line`
 * edge, not by fill contrast or a resting shadow. `variant` is kept for the
 * callers that still pass it, but both look the same now.
 */
export function Card({
  children,
  className,
  id,
  variant = "flat",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: "flat" | "glass";
  interactive?: boolean;
}) {
  void variant;
  return (
    <section
      id={id}
      className={cn(
        "rounded-2xl border border-line bg-surface p-5",
        interactive &&
          "transition-[border-color] duration-200 ease-out-soft hover:border-line-strong",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardTitle({
  children,
  extra,
}: {
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold tracking-normal">{children}</h2>
      {extra != null && (
        <span className="shrink-0 text-xs font-medium text-muted">{extra}</span>
      )}
    </div>
  );
}
