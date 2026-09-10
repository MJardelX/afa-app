import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Metric card: big number + a delta pill and/or a context line + icon.
 *
 * The tone only paints the icon chip and the delta pill; the datum never
 * depends on color, which is why the context line is always written out.
 */
type Tone = "brand" | "accent" | "good" | "fair" | "low";
type DeltaTone = "up" | "down" | "warn" | "neutral";

const CHIP: Record<Tone, string> = {
  brand: "from-brand-subtle text-brand-legible",
  accent: "from-accent-subtle text-accent",
  good: "from-status-good-bg text-status-good-fg",
  fair: "from-status-fair-bg text-status-fair-fg",
  low: "from-status-low-bg text-status-low-fg",
};

const DELTA: Record<DeltaTone, string> = {
  up: "bg-status-good-bg text-status-good-fg",
  down: "bg-status-low-bg text-status-low-fg",
  warn: "bg-accent text-accent-fg",
  neutral: "bg-surface-2 text-muted",
};

const DELTA_ICON = {
  up: ArrowUp,
  down: ArrowDown,
  warn: TriangleAlert,
  neutral: Minus,
} as const;

export function Metric({
  title,
  value,
  foot,
  delta,
  icon,
  tone = "brand",
}: {
  title: string;
  value: string | number;
  foot?: ReactNode;
  delta?: { tone: DeltaTone; label: string };
  icon: ReactNode;
  tone?: Tone;
}) {
  const DeltaGlyph = delta ? DELTA_ICON[delta.tone] : null;

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted">{title}</p>
        <span
          aria-hidden
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br to-transparent ring-1 ring-inset ring-line [&_svg]:size-[1.1rem]",
            CHIP[tone],
          )}
        >
          {icon}
        </span>
      </div>

      <p className="mt-2.5 text-[2rem] font-semibold leading-none tracking-tight tabular-nums">
        {value}
      </p>

      {(delta || foot) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta && DeltaGlyph && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.7rem] font-semibold",
                DELTA[delta.tone],
              )}
            >
              <DeltaGlyph className="size-3" strokeWidth={2.5} />
              {delta.label}
            </span>
          )}
          {foot && <span className="text-xs text-muted">{foot}</span>}
        </div>
      )}
    </div>
  );
}
