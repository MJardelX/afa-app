import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { EvaluationForm } from "@/components/assessment/evaluation-form";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  canEvaluatePlayer,
  getPlayerEvaluation,
  listActiveCriteria,
} from "@/server/evaluation";
import { currentProfile, getPlayer } from "@/server/players";
import { getTeamHeader } from "@/server/teams";

function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jugadorId: string }>;
}) {
  const { jugadorId } = await params;
  const player = await getPlayer(jugadorId);
  return { title: player ? `${player.nombre_completo} · AFA Manager` : "AFA Manager" };
}

export default async function PlayerEvaluationPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string; jugadorId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { teamId, jugadorId } = await params;
  const t = await getTranslations("evaluation");
  const sp = await searchParams;
  const periodId = str(sp.period);

  const [player, team, profile] = await Promise.all([
    getPlayer(jugadorId),
    getTeamHeader(teamId),
    currentProfile(),
  ]);
  if (!player || !team || !profile || !periodId) notFound();

  const allowed = await canEvaluatePlayer(jugadorId, profile);
  if (!allowed) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted">{t("noPermission")}</p>
        <Link
          href={`/assessment/${teamId}?period=${periodId}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-legible hover:underline"
        >
          <ArrowLeft className="size-4" />
          {team.nombre}
        </Link>
      </div>
    );
  }

  const [evaluation, criteria] = await Promise.all([
    getPlayerEvaluation(jugadorId, periodId, profile.id),
    listActiveCriteria(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Link
        href={`/assessment/${teamId}?period=${periodId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {team.nombre}
      </Link>

      <Card className="flex items-center gap-4">
        <Avatar name={player.nombre_completo ?? ""} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {player.nombre_completo}
          </h1>
          <p className="text-sm text-muted">
            {player.codigo} · {team.categoria}
          </p>
        </div>
      </Card>

      {criteria.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("noCriteria")}</p>
      ) : (
        <EvaluationForm
          jugadorId={jugadorId}
          periodoId={periodId}
          criteria={criteria}
          initialScores={evaluation.scores}
          initialComment={evaluation.comentarioGeneral}
          estado={evaluation.estado}
        />
      )}
    </div>
  );
}
