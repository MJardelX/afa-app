"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";

import { controlClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Debounced search box. Writes `?q=` (and resets `?page=`) into the URL, which
 * re-renders the Server Component list. `key` on the parent should include the
 * pathname so the input resets when navigating away.
 */
export function SearchInput({
  placeholder,
  paramName = "q",
}: {
  placeholder: string;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(params.get(paramName) ?? "");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value) next.set(paramName, value);
      else next.delete(paramName);
      next.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        aria-hidden
        strokeWidth={1.6}
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          controlClass,
          "!h-10 pl-9 pr-9 text-sm [&::-webkit-search-cancel-button]:hidden",
        )}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2">
        {pending ? (
          <LoaderCircle className="size-4 animate-spin text-muted" />
        ) : value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            className="text-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </span>
    </div>
  );
}
