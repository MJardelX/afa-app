import type { ReactNode } from "react";

/**
 * Horizontal bar list for "count per category".
 *
 * One series = one color. Painting each category a different color would
 * suggest the color means something, and here it means nothing: the length
 * already carries all the information.
 *
 * Each bar has its value written beside it, so the datum reads without relying
 * on the color or on hovering.
 */
export function BarList({
  data,
  empty,
}: {
  data: { label: string; value: number; note?: string }[];
  empty?: ReactNode;
}) {
  if (data.length === 0) {
    return <>{empty}</>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="-my-1.5">
      {data.map((d) => (
        <li
          key={d.label}
          className="grid grid-cols-[4.5rem_1fr_2.25rem] items-center gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-surface-2"
        >
          <span className="truncate text-xs font-medium text-muted">
            {d.label}
          </span>

          <span
            className="h-2 w-full overflow-hidden rounded-full bg-chart-track"
            title={`${d.label}: ${d.value}${d.note ? ` · ${d.note}` : ""}`}
          >
            <span
              className="block h-full rounded-full bg-chart-bar"
              style={{ width: `${Math.max((d.value / max) * 100, 4)}%` }}
            />
          </span>

          <span className="text-right text-sm font-semibold tabular-nums">
            {d.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
