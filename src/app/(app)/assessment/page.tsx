import { getTranslations } from "next-intl/server";
import { ClipboardList } from "lucide-react";

import { PeriodSelect } from "@/components/assessment/period-select";
import { TeamEvalCard } from "@/components/assessment/team-eval-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listCalendarTeams, type CalendarTeam } from "@/server/attendance";
import { listTeamEvaluationCounts } from "@/server/evaluation";
import { activeSeason, currentProfile, isAdmin } from "@/server/players";
import { listPeriods } from "@/server/settings";

export async function generateMetadata() {
  const t = await getTranslations("evaluation");
  return { title: t("metaTitle") };
}

function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("evaluation");
  const sp = await searchParams;

  const [season, profile] = await Promise.all([activeSeason(), currentProfile()]);

  if (!season) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState icon={<ClipboardList strokeWidth={1.5} />} title={t("noSeason")} />
      </div>
    );
  }

  const periods = await listPeriods(season.id);
  if (periods.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState icon={<ClipboardList strokeWidth={1.5} />} title={t("noPeriods")} />
      </div>
    );
  }

  const requested = str(sp.period);
  const selected =
    periods.find((p) => p.id === requested) ??
    periods.find((p) => !p.cerrado) ??
    periods[periods.length - 1];

  const teams = await listCalendarTeams();
  const admin = isAdmin(profile?.rol);
  const myTeams = admin
    ? teams
    : teams.filter(
        (tm) => tm.entrenadorId === profile?.id || tm.auxiliarId === profile?.id,
      );

  const counts = profile
    ? await listTeamEvaluationCounts(
        myTeams.map((tm) => tm.id),
        selected.id,
        profile.id,
      )
    : new Map();

  const groups = new Map<
    string,
    { categoriaId: string; categoria: string; color: string; teams: CalendarTeam[] }
  >();
  for (const tm of myTeams) {
    if (!groups.has(tm.categoriaId)) {
      groups.set(tm.categoriaId, {
        categoriaId: tm.categoriaId,
        categoria: tm.categoria,
        color: tm.color,
        teams: [],
      });
    }
    groups.get(tm.categoriaId)!.teams.push(tm);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <PeriodSelect
        periods={periods.map((p) => ({ id: p.id, nombre: p.nombre }))}
        selectedId={selected.id}
      />

      {myTeams.length === 0 ? (
        <EmptyState icon={<ClipboardList strokeWidth={1.5} />} title={t("teamsEmpty")} />
      ) : (
        <div className="space-y-8">
          {[...groups.values()].map((g) => (
            <section key={g.categoriaId} className="space-y-3">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: g.color }}
                />
                {g.categoria}
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
                {g.teams.map((tm) => (
                  <TeamEvalCard
                    key={tm.id}
                    team={tm}
                    periodId={selected.id}
                    summary={counts.get(tm.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
