import type { ReactNode } from "react";

/**
 * Empty state for a card body. An icon in a soft ring, a one-line message and
 * an optional hint — so a section with no data yet still looks intentional
 * instead of like a rendering bug.
 */
export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 py-8 text-center">
      <span
        aria-hidden
        className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-muted ring-1 ring-inset ring-line [&_svg]:size-5"
      >
        {icon}
      </span>
      <p className="text-sm font-medium text-fg">{title}</p>
      {hint && (
        <p className="max-w-[28ch] text-xs leading-relaxed text-muted">{hint}</p>
      )}
    </div>
  );
}
