import { useTranslations } from "next-intl";
import { Check, TriangleAlert, X, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type AttendanceLevel = "good" | "fair" | "low";

export function attendanceLevel(percent: number): AttendanceLevel {
  if (percent >= 85) return "good";
  if (percent >= 70) return "fair";
  return "low";
}

/**
 * The scale NEVER communicates by color alone: every level carries its own
 * icon and a written label. The colors are also not pure green/yellow/red —
 * that triad is indistinguishable in protanopia (dE 3.6 between green and
 * yellow). The three glyphs (check / triangle / cross) stay distinct shapes.
 */
const LEVELS: Record<
  AttendanceLevel,
  { classes: string; dot: string; Icon: LucideIcon }
> = {
  good: {
    classes: "bg-status-good-bg text-status-good-fg",
    dot: "bg-status-good",
    Icon: Check,
  },
  fair: {
    classes: "bg-status-fair-bg text-status-fair-fg",
    dot: "bg-status-fair",
    Icon: TriangleAlert,
  },
  low: {
    classes: "bg-status-low-bg text-status-low-fg",
    dot: "bg-status-low",
    Icon: X,
  },
};

export function AttendanceBadge({
  level,
  percent,
  className,
}: {
  level: AttendanceLevel;
  percent?: number;
  className?: string;
}) {
  const t = useTranslations("attendanceLevel");
  const { classes, Icon } = LEVELS[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        classes,
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
      {t(level)}
      {percent !== undefined && (
        <span className="tabular-nums opacity-80">{percent}%</span>
      )}
    </span>
  );
}

/** Compact dot for dense lists. Always accompanied by text beside it. */
export function StatusDot({ level }: { level: AttendanceLevel }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 rounded-full", LEVELS[level].dot)}
    />
  );
}
