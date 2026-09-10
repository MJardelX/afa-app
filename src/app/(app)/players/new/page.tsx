import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { PlayerWizard } from "@/components/players/player-wizard";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  activeCategories,
  activeSeason,
  currentProfile,
  isAdmin,
} from "@/server/players";
import { listTeams } from "@/server/teams";

export async function generateMetadata() {
  const t = await getTranslations("players");
  return { title: `${t("newTitle")} · AFA Manager` };
}

export default async function NewPlayerPage() {
  const t = await getTranslations("players");

  const [profile, categories, season, teams] = await Promise.all([
    currentProfile(),
    activeCategories(),
    activeSeason(),
    listTeams(),
  ]);

  const backLink = (
    <Link
      href="/players"
      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
    >
      <ArrowLeft className="size-4" />
      {t("title")}
    </Link>
  );

  if (!isAdmin(profile?.rol)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted">{t("adminOnly")}</p>
        <Link
          href="/players"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-legible hover:underline"
        >
          <ArrowLeft className="size-4" />
          {t("title")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader title={t("newTitle")} action={backLink} />
      {!season ? (
        <Card>
          <p className="py-10 text-center text-sm text-muted">{t("noSeason")}</p>
        </Card>
      ) : (
        <PlayerWizard
          categories={categories}
          seasonYear={season.anio}
          teamGroups={teams.groups.map((g) => ({
            categoriaId: g.categoriaId,
            categoria: g.categoria,
            color: g.color,
            teams: g.teams,
          }))}
        />
      )}
    </div>
  );
}
