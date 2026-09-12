import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { NAVIGATION } from "@/components/app/navigation";

/**
 * Grid of shortcuts to the modules. Same sky treatment for every card: they
 * are told apart by icon and label, not by color. Painting each module a
 * different color would suggest the color means something.
 *
 * The source is NAVIGATION, the same one as the sidebar: if a module is not
 * ready yet, it shows here disabled with "Soon" too.
 */
const DESC_KEY = {
  players: "moduleDescPlayers",
  attendance: "moduleDescAttendance",
  assessment: "moduleDescAssessment",
  teams: "moduleDescTeams",
  reports: "moduleDescReports",
  settings: "moduleDescSettings",
} as const;

export function Modules() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");
  const modules = NAVIGATION.filter((item) => item.href !== "/");

  return (
    <section aria-labelledby="modules-title">
      <h2 id="modules-title" className="mb-3 text-sm font-semibold">
        {t("modulesTitle")}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map(({ href, key, ready, Icon }) => {
          const content = (
            <>
              <div className="flex items-start justify-between">
                <span
                  aria-hidden
                  className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-subtle to-transparent text-brand-legible ring-1 ring-inset ring-line"
                >
                  <Icon className="size-[1.15rem]" strokeWidth={1.75} />
                </span>
                {ready ? (
                  <ArrowRight
                    aria-hidden
                    strokeWidth={1.75}
                    className="size-4 text-muted transition-transform duration-200 ease-out-soft group-hover:translate-x-0.5 group-hover:text-brand-legible"
                  />
                ) : (
                  <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-muted ring-1 ring-inset ring-line">
                    {tNav("soon")}
                  </span>
                )}
              </div>

              <div className="mt-3 min-w-0">
                <p className="text-sm font-semibold">{tNav(key)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {t(DESC_KEY[key as keyof typeof DESC_KEY])}
                </p>
              </div>
            </>
          );

          const base = "glass-panel block rounded-2xl p-4";

          if (!ready) {
            return (
              <div key={href} aria-disabled className={`${base} opacity-70`}>
                {content}
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`group ${base} transition-[border-color] duration-200 ease-out-soft hover:border-line-strong`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
