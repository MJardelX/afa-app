import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Thin semantic table primitives — one look for every read-only listing in the
 * app. Rows aren't links (a <tr> can't be one); put a <Link> in the primary
 * cell instead.
 *
 * `bare` drops the outer frame (border + surface + radius) for tables that live
 * inside a <Card> that already provides it; the header band, row dividers and
 * typography are identical either way.
 */
export function DataTable({
  children,
  className,
  bare = false,
}: {
  children: ReactNode;
  className?: string;
  bare?: boolean;
}) {
  const table = (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-sm",
          // Flush the outer cells with the surrounding card's content edge.
          bare &&
            "[&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_th:first-child]:pl-0 [&_th:last-child]:pr-0",
          className,
        )}
      >
        {children}
      </table>
    </div>
  );

  if (bare) return table;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {table}
    </div>
  );
}

type Align = "left" | "center" | "right";

const ALIGN: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function Th({
  align = "left",
  className,
  ...props
}: ComponentProps<"th"> & { align?: Align }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap bg-surface-2 px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-fg",
        ALIGN[align],
        className,
      )}
      {...props}
    />
  );
}

export function Tr({
  head = false,
  className,
  ...props
}: ComponentProps<"tr"> & { head?: boolean }) {
  return (
    <tr
      className={cn(
        head
          ? "border-b border-line-strong"
          : "border-t border-line transition-colors first:border-t-0 hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  align = "left",
  className,
  ...props
}: ComponentProps<"td"> & { align?: Align }) {
  return (
    <td
      className={cn(
        "whitespace-nowrap px-4 py-3 align-middle",
        ALIGN[align],
        className,
      )}
      {...props}
    />
  );
}
