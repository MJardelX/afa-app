"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const current = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="radiogroup"
      aria-label={t("groupLabel")}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-line bg-surface/60 p-0.5 backdrop-blur",
        className,
      )}
    >
      {locales.map((locale) => {
        const active = current === locale;
        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t("switchTo", { language: t(locale) })}
            disabled={pending || active}
            onClick={() =>
              startTransition(async () => {
                await setLocale(locale as Locale);
                router.refresh();
              })
            }
            className={cn(
              "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[0.7rem] font-semibold uppercase transition-colors",
              active
                ? "bg-brand text-brand-fg"
                : "text-muted hover:bg-brand-subtle hover:text-brand-legible",
            )}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
