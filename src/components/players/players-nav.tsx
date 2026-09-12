"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/players", key: "tabList" },
  { href: "/players/tutors", key: "tabGuardians" },
] as const;

/**
 * Sub-navigation for the two "people in the academy" list views. Light
 * underline tabs — a page-level switch, not a control, so it stays visually
 * quiet. Active state is an exact path match on purpose. (Filtering players by
 * category lives in the list's own filter chips, not a tab.)
 */
export function PlayersNav() {
  const pathname = usePathname();
  const t = useTranslations("players");

  return (
    <nav className="flex gap-5 border-b border-line">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 pb-2.5 text-sm font-medium transition-colors",
              active
                ? "border-brand-legible text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
