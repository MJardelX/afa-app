import { cn } from "@/lib/utils";

/** Numbered position pill — the top 3 get a subtle accent, not just a number. */
export function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
        rank === 1 && "bg-accent text-accent-fg",
        rank === 2 && "bg-surface-2 text-fg ring-1 ring-inset ring-line-strong",
        rank === 3 && "bg-brand-subtle text-brand-legible",
        rank > 3 && "bg-surface-2 text-muted",
      )}
    >
      {rank}
    </span>
  );
}
