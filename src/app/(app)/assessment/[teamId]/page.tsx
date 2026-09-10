import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { PeriodSelect } from "@/components/assessment/period-select";
import { RosterStatusList } from "@/components/assessment/roster-status-list";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getTeamEvaluationRoster } from "@/server/evaluation";
import { activeSeason, currentProfile } from "@/server/players";
import { listPeriods } from "@/server/settings";
import { getTeamHeader } from "@/server/teams";

function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const team = await getTeamHeader(teamId);
  return { title: team ? `${team.nombre} · AFA Manager` : "AFA Manager" };
}

export default async function TeamAssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { teamId } = await params;
  const t = await getTranslations("evaluation");
  const sp = await searchParams;

  const [team, season, profile] = await Promise.all([
    getTeamHeader(teamId),
    activeSeason(),
    currentProfile(),
  ]);
  if (!team || !season || !profile) notFound();

  const periods = await listPeriods(season.id);
  if (periods.length === 0) notFound();

  const requested = str(sp.period);
  const selected =
    periods.find((p) => p.id === requested) ??
    periods.find((p) => !p.cerrado) ??
    periods[periods.length - 1];

  const roster = await getTeamEvaluationRoster(teamId, selected.id, profile.id);

  return (
    <div className="space-y-5">
      <Link
        href="/assessment"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <PageHeader title={team.nombre} description={team.categoria} />
      <PeriodSelect
        periods={periods.map((p) => ({ id: p.id, nombre: p.nombre }))}
        selectedId={selected.id}
      />

      <Card>
        <CardTitle extra={roster.length > 0 ? String(roster.length) : undefined}>
          {t("title")}
        </CardTitle>
        <RosterStatusList
          teamId={teamId}
          periodId={selected.id}
          roster={roster}
        />
      </Card>
    </div>
  );
}
