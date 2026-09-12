import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * URL-driven pagination (`?page=`). Server Component: it just builds hrefs.
 * `page` is 1-based.
 */
export async function Pagination({
  page,
  pageSize,
  total,
  searchParams,
  labelRange,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** current search params, so filters/search survive page changes */
  searchParams: Record<string, string | undefined>;
  /** e.g. (from, to, total) => `${from}–${to} of ${total}` */
  labelRange: (from: number, to: number, total: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const tc = await getTranslations("common");
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const hrefFor = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") next.set(k, v);
    }
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `?${qs}` : "?";
  };

  const linkClass =
    "flex size-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-2 hover:text-fg aria-disabled:pointer-events-none aria-disabled:opacity-40";

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted">{labelRange(from, to, total)}</p>
      <div className="flex items-center gap-1.5">
        <Link
          href={hrefFor(page - 1)}
          aria-disabled={page <= 1}
          aria-label={tc("prevPage")}
          className={linkClass}
        >
          <ChevronLeft className="size-4" />
        </Link>
        <span className="px-1 text-xs tabular-nums text-muted">
          {page} / {pages}
        </span>
        <Link
          href={hrefFor(page + 1)}
          aria-disabled={page >= pages}
          aria-label={tc("nextPage")}
          className={cn(linkClass)}
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
