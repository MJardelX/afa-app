"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Client-side paging over an array the page already fetched in full (team
 * roster, settings list, report ranking...). No refetch, no URL state — just
 * slices what's already in memory. `page` self-clamps if `items` shrinks
 * (e.g. after a delete) so it never points past the last page.
 */
export function usePagedList<T>(items: T[], pageSize = 15) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    setPage,
    pageCount,
    pageItems: items.slice(start, start + pageSize),
  };
}

/** Compact prev/next control for `usePagedList`. Renders nothing for a single page. */
export function ListPagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  const tc = useTranslations("common");
  if (pageCount <= 1) return null;

  const btnClass =
    "flex size-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={tc("prevPage")}
        className={btnClass}
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="px-1 text-xs tabular-nums text-muted">
        {page} / {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label={tc("nextPage")}
        className={btnClass}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
