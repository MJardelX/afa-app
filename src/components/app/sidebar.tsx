"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { PanelLeftClose } from "lucide-react";

import { NAVIGATION, NAV_GROUPS } from "@/components/app/navigation";
import { toggleSidebar } from "@/components/app/sidebar-store";
import { UserMenu } from "@/components/app/user-menu";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export function Sidebar({
  season,
  name,
  role,
}: {
  season?: string;
  name: string;
  role: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tApp = useTranslations("app");

  const primary = NAVIGATION.filter((i) => !i.group);
  const groupLabel = {
    manage: t("groupManage"),
    operate: t("groupOperate"),
    system: t("groupSystem"),
  } as const;

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="app-sidebar glass sticky top-5 z-30 hidden h-[calc(100dvh-2.5rem)] shrink-0 self-start rounded-2xl lg:flex">
      <div className="flex w-full min-w-14 flex-col">
        {/* Brand + collapse control. */}
        <div className="sidebar-row flex h-12 items-center gap-2 border-b border-line px-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={t("expand")}
            title={tApp("name")}
            className="flex min-w-0 items-center gap-2 rounded-lg"
          >
            <Logo className="size-6 shrink-0" />
            <span className="sidebar-label inline-flex min-w-0 flex-col text-left leading-none">
              <span className="truncate text-[0.8rem] font-semibold tracking-tight">
                {tApp("name")}
              </span>
              {season && (
                <span className="mt-0.5 truncate text-[0.65rem] font-normal text-muted">
                  {season}
                </span>
              )}
            </span>
          </button>

          <div className="sidebar-label flex-1" />

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={t("collapse")}
            title={t("collapse")}
            className="sidebar-collapse-btn sidebar-label -mr-1 flex size-6 shrink-0 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <PanelLeftClose className="size-[0.9rem]" strokeWidth={1.75} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {primary.map((item) => (
              <NavRow key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </div>

          {NAV_GROUPS.map((group) => {
            const items = NAVIGATION.filter((i) => i.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <p className="sidebar-label px-3 pb-1.5 pt-4 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-faint">
                  {groupLabel[group]}
                </p>
                <div className="sidebar-mini-sep" aria-hidden />
                <div className="space-y-1">
                  {items.map((item) => (
                    <NavRow
                      key={item.href}
                      item={item}
                      active={isActive(item.href)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <UserMenu name={name} role={role} />
      </div>
    </aside>
  );
}

function NavRow({
  item: { href, key, ready, Icon },
  active,
}: {
  item: (typeof NAVIGATION)[number];
  active: boolean;
}) {
  const t = useTranslations("nav");
  const label = t(key);

  const inner = (
    <>
      <Icon
        className={cn("size-[1.125rem] shrink-0", active && "text-brand-legible")}
        strokeWidth={active ? 1.9 : 1.6}
      />
      <span className="sidebar-label flex-1 truncate">{label}</span>
      {!ready && (
        <span className="sidebar-label rounded-full px-1 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-faint ring-1 ring-inset ring-line">
          {t("soon")}
        </span>
      )}
    </>
  );

  const base =
    "sidebar-row flex items-center gap-2.5 rounded-lg px-3 py-[0.4375rem] text-[0.8125rem] transition-colors duration-150";

  if (!ready) {
    return (
      <span
        aria-disabled
        title={`${label} · ${t("soonHint")}`}
        className={cn(base, "cursor-default text-faint")}
      >
        {inner}
      </span>
    );
  }

  return (
    <Link
      href={href}
      title={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        active
          ? "bg-brand-subtle font-medium text-brand-legible"
          : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {inner}
    </Link>
  );
}
