"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { NAVIGATION } from "@/components/app/navigation";
import { cn } from "@/lib/utils";

const SHORT_KEY = {
  dashboard: "shortDashboard",
  players: "shortPlayers",
  attendance: "shortAttendance",
  assessment: "shortAssessment",
  teams: "shortTeams",
  reports: "shortReports",
  settings: "shortSettings",
} as const;

/** Settings is desk work, not pitch-side — keep it off the mobile bar. */
const MOBILE = NAVIGATION.filter((item) => item.key !== "settings");

/**
 * Mobile navigation. Coaches use the system pitch-side, phone in one hand: a
 * bottom bar within thumb reach, not a hamburger menu. Glass pays off here
 * because content scrolls underneath.
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="app-bottom-nav glass fixed inset-x-3 bottom-3 z-20 flex justify-around rounded-2xl px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      {MOBILE.map(({ href, key, ready, Icon }) => {
        const active = pathname === href;
        const classes = cn(
          "flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[0.65rem] transition-colors",
          active ? "font-semibold text-brand-legible" : "text-muted",
          !ready && "text-faint",
        );

        if (!ready) {
          return (
            <span key={href} aria-disabled className={classes}>
              <Icon className="size-[1.15rem]" strokeWidth={1.75} />
              {t(SHORT_KEY[key])}
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={classes}
          >
            <Icon className="size-[1.15rem]" strokeWidth={active ? 2 : 1.75} />
            {t(SHORT_KEY[key])}
          </Link>
        );
      })}
    </nav>
  );
}
