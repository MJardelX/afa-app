import type { ReactNode } from "react";

/** Key/value list — `<dl>` with hairline dividers. Used across entity profiles. */
export function DetailList({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-line text-sm">{children}</dl>;
}

export function Detail({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted">{term}</dt>
      <dd className="min-w-0 text-right font-medium">{children ?? "—"}</dd>
    </div>
  );
}
