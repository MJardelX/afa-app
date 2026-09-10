import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus, Shield } from "lucide-react";

import { TeamCategoryCard } from "@/components/teams/team-category-card";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { currentProfile, isAdmin } from "@/server/players";
import { listTeams } from "@/server/teams";

export async function generateMetadata() {
  const t = await getTranslations("teams");
  return { title: t("metaTitle") };
}

export default async function TeamsPage() {
  const t = await getTranslations("teams");

  const [{ season, groups }, profile] = await Promise.all([
    listTeams(),
    currentProfile(),
  ]);
  const admin = isAdmin(profile?.rol);

  const totalTeams = groups.reduce((n, g) => n + g.teams.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          admin && season ? (
            <Link href="/teams/new" className={buttonClasses("primary", "md")}>
              <Plus className="size-4" />
              {t("new")}
            </Link>
          ) : undefined
        }
      />

      {!season ? (
        <EmptyState icon={<Shield strokeWidth={1.5} />} title={t("noSeason")} />
      ) : totalTeams === 0 ? (
        <EmptyState
          icon={<Shield strokeWidth={1.5} />}
          title={t("empty")}
          hint={admin ? t("emptyHint") : undefined}
        />
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <TeamCategoryCard key={g.categoriaId} group={g} admin={admin} />
          ))}
        </div>
      )}
    </div>
  );
}
