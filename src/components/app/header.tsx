import Link from "next/link";
import { useTranslations } from "next-intl";

import { Logo } from "@/components/ui/logo";

export function Header({ name, season }: { name: string; season?: string }) {
  const t = useTranslations();

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    // Mobile / tablet only — there is no sidebar below `lg`, so this bar carries
    // the brand and the account link. On desktop it's gone entirely.
    <header className="app-header glass sticky top-3 z-20 rounded-2xl lg:hidden">
      <div className="flex h-12 items-center gap-2.5 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Logo className="size-6 shrink-0" />
          <span className="inline-flex min-w-0 flex-col leading-none">
            <span className="truncate text-[0.8rem] font-semibold">
              {t("app.name")}
            </span>
            {season && (
              <span className="mt-0.5 truncate text-[0.7rem] text-muted">
                {season}
              </span>
            )}
          </span>
        </div>

        <div className="flex-1" />

        <Link
          href="/account"
          aria-label={t("header.account")}
          className="flex shrink-0 items-center justify-center rounded-full ring-offset-2 ring-offset-canvas transition-shadow hover:ring-2 hover:ring-brand/40"
        >
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-hover text-[0.7rem] font-semibold text-brand-fg ring-2 ring-surface"
          >
            {initials}
          </span>
        </Link>
      </div>
    </header>
  );
}
