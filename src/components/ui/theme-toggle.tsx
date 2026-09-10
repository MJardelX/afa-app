"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

export type Theme = "light" | "dark";

/** Read by the inline boot script in layout.tsx before paint, to avoid the flash. */
export const THEME_KEY = "afa-theme";
const EVENT = "afa-theme-change";

/* The theme lives in the DOM and in localStorage, not in React state — read
   with useSyncExternalStore so React subscribes to it instead of duplicating
   it. Only two states now: light and dark, no "system". A first-time visitor
   still follows their OS until they pick one. */

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
    mq.removeEventListener("change", onChange);
  };
}

/** The effective theme: the explicit choice, or the OS preference. */
function read(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    // fall through
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const readOnServer = (): Theme => "light";

/** false during SSR and the first client render, true afterwards. */
const noopSubscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  try {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode without storage: the theme still applies for this session.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The effective theme, hydration-safe (the server default until mounted). */
export function useTheme(): Theme {
  const theme = useSyncExternalStore(subscribe, read, readOnServer);
  return useHydrated() ? theme : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const shown = useTheme();
  const t = useTranslations("theme");

  const next: Theme = shown === "dark" ? "light" : "dark";
  const label = t(next === "dark" ? "toDark" : "toLight");

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-subtle hover:text-brand-legible",
        className,
      )}
    >
      {shown === "dark" ? (
        <Sun className="size-4" strokeWidth={1.75} />
      ) : (
        <Moon className="size-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
