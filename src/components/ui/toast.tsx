"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { CircleAlert, CircleCheck, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";
type ToastRecord = { id: number; message: string; tone: ToastTone; leaving: boolean };

const DURATION_MS = 4000;
const EXIT_MS = 200;

const ToastContext = createContext<
  ((message: string, tone?: ToastTone) => void) | null
>(null);

/**
 * Floating, auto-dismissing notifications — stacked bottom-center on mobile
 * (clear of the bottom nav) and bottom-right on larger screens. Mount once at
 * the root; call `useToast()` from any client component under it to fire one.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, tone, leaving: false }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATION_MS),
      );
    },
    [dismiss],
  );

  // Timers are keyed by id in a ref, so clearing them on unmount needs the
  // live map read at cleanup time, not the one captured at mount.
  useEffect(() => {
    const timerMap = timers.current;
    return () => {
      for (const timer of timerMap.values()) clearTimeout(timer);
    };
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:items-end lg:px-0"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: () => void;
}) {
  const tc = useTranslations("common");
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const visible = entered && !toast.leaving;

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={cn(
        "glass pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl px-4 py-3 text-sm transition-all duration-200 ease-out-soft",
        toast.tone === "error" ? "glass-error" : "glass-success",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      {toast.tone === "error" ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={2} />
      ) : (
        <CircleCheck
          className="mt-0.5 size-4 shrink-0 text-status-good-fg"
          strokeWidth={2}
        />
      )}
      <span className="min-w-0 flex-1 text-fg">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={tc("close")}
        className="shrink-0 text-faint transition-colors hover:text-fg"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
