"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";

import { LanguageToggle } from "@/components/ui/language-toggle";
import { applyTheme, useTheme, type Theme } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

/** Theme + language, as labelled rows with segmented controls. */
export function AccountPreferences() {
  const t = useTranslations();

  return (
    <div className="divide-y divide-line">
      <Row label={t("theme.groupLabel")} hint={t("account.themeHint")}>
        <ThemeChoice />
      </Row>
      <Row label={t("language.groupLabel")} hint={t("account.languageHint")}>
        <LanguageToggle />
      </Row>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ThemeChoice() {
  const theme = useTheme();
  const t = useTranslations("theme");

  const options: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: "light", label: t("optLight"), Icon: Sun },
    { value: "dark", label: t("optDark"), Icon: Moon },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t("groupLabel")}
      className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5"
    >
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => applyTheme(value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              active
                ? "bg-brand text-brand-fg"
                : "text-muted hover:bg-brand-subtle hover:text-brand-legible",
            )}
          >
            <Icon className="size-3.5" strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
