"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings/categories", key: "navCategories" },
  { href: "/settings/seasons", key: "navSeasons" },
  { href: "/settings/periods", key: "navPeriods" },
  { href: "/settings/criteria", key: "navCriteria" },
  { href: "/settings/renewal", key: "navRenewal" },
] as const;

const AUDIT_TAB = { href: "/settings/audit", key: "navAudit" } as const;

/** `showAudit` is true only for directors — audit is director-only. */
export function SettingsNav({ showAudit = false }: { showAudit?: boolean }) {
  const pathname = usePathname();
  const t = useTranslations("settings");
  const tabs = showAudit ? [...TABS, AUDIT_TAB] : TABS;

  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-subtle text-brand-legible"
                : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
