"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A small, quiet info icon that reveals a one-line explanation: on hover for
 * mouse users, on tap for touch. Safe to nest inside a link — it swallows the
 * click so the surrounding navigation doesn't fire.
 */
export function InfoHint({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const swallow = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <span ref={ref} className={cn("relative inline-flex", className)}>
      <span
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        className="inline-flex cursor-help rounded-sm text-faint outline-none transition-colors hover:text-brand-legible focus-visible:ring-2 focus-visible:ring-brand/30"
        onClick={(e) => {
          swallow(e);
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            swallow(e);
            setOpen((v) => !v);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setOpen(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info className="size-3.5" strokeWidth={2} aria-hidden />
      </span>

      {open && (
        <span
          id={id}
          role="tooltip"
          className="glass-panel absolute left-0 top-full z-50 mt-1.5 w-52 max-w-[min(16rem,80vw)] rounded-lg p-2.5 text-xs font-normal leading-snug text-fg shadow-pop"
        >
          {text}
        </span>
      )}
    </span>
  );
}
