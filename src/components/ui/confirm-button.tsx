"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A button that asks for confirmation in a small popover before submitting its
 * enclosing <form> (so the actual mutation stays a Server Action). Wrap it in
 * `<form action={someServerAction}>` with the needed hidden inputs.
 */
export function ConfirmButton({
  children,
  question,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  className,
  label,
}: {
  children: React.ReactNode;
  question: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "danger" | "brand";
  className?: string;
  /** Accessible name for an icon-only trigger — sets `title` and `aria-label`. */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={className}
        title={label}
        aria-label={label}
      >
        {children}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="glass-panel absolute right-0 z-50 mt-2 w-60 rounded-xl p-3 text-left shadow-pop">
            <p className="text-sm">{question}</p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-fg"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-fg",
                  tone === "danger" ? "bg-danger" : "bg-brand hover:bg-brand-hover",
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
