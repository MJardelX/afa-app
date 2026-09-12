"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/reports/attendance", key: "navAttendance" },
  { href: "/reports/evaluation", key: "navEvaluation" },
] as const;

export function ReportsNav() {
  const pathname = usePathname();
  const t = useTranslations("reports");

  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
      {TABS.map((tab) => {
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
