"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Sidebar-footer account link. The user's identity is the anchor; tapping it
 * opens the full account page (details + theme + language + sign out).
 */
export function UserMenu({ name, role }: { name: string; role: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const active = pathname === "/account";

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const roleLabel = t.has(`roles.${role}`) ? t(`roles.${role}`) : role;

  return (
    <div className="border-t border-line">
      <Link
        href="/account"
        aria-current={active ? "page" : undefined}
        aria-label={t("header.account")}
        className={cn(
          "sidebar-row flex h-14 w-full items-center gap-2.5 rounded-b-[15px] px-3 text-left transition-colors",
          active ? "bg-surface-2" : "hover:bg-surface-2",
        )}
      >
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-hover text-[0.62rem] font-semibold text-brand-fg ring-2 ring-surface"
        >
          {initials}
        </span>
        <span className="sidebar-label min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[0.78rem] font-medium">{name}</span>
          <span className="block truncate text-[0.65rem] text-muted">
            {roleLabel}
          </span>
        </span>
        <ChevronRight
          className="sidebar-label size-4 shrink-0 text-faint"
          strokeWidth={1.7}
        />
      </Link>
    </div>
  );
}
