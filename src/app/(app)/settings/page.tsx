import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  CalendarRange,
  ClipboardList,
  History,
  Layers,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { currentProfile } from "@/server/players";
import { settingsCounts } from "@/server/settings";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: t("metaTitle") };
}

export default async function SettingsHubPage() {
  const t = await getTranslations("settings");
  const [counts, profile] = await Promise.all([
    settingsCounts(),
    currentProfile(),
  ]);
  const director = profile?.rol === "director";

  const cards: {
    href: string;
    title: string;
    desc: string;
    count: number | null;
    Icon: LucideIcon;
  }[] = [
    {
      href: "/settings/categories",
      title: t("navCategories"),
      desc: t("hubCategoriesDesc"),
      count: counts.categories,
      Icon: Layers,
    },
    {
      href: "/settings/seasons",
      title: t("navSeasons"),
      desc: t("hubSeasonsDesc"),
      count: counts.seasons,
      Icon: CalendarRange,
    },
    {
      href: "/settings/periods",
      title: t("navPeriods"),
      desc: t("hubPeriodsDesc"),
      count: counts.periods,
      Icon: ClipboardList,
    },
    {
      href: "/settings/criteria",
      title: t("navCriteria"),
      desc: t("hubCriteriaDesc"),
      count: counts.criteria,
      Icon: ListChecks,
    },
    ...(director
      ? [
          {
            href: "/settings/audit",
            title: t("navAudit"),
            desc: t("hubAuditDesc"),
            count: null,
            Icon: History,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card
              interactive
              className="flex h-full items-start gap-3.5 transition"
            >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-legible"
              >
                <c.Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold">{c.title}</h2>
                  {c.count != null && (
                    <span className="text-xs tabular-nums text-faint">
                      {t("itemCount", { count: c.count })}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {c.desc}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
