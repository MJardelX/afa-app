import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { PeriodSelect } from "@/components/assessment/period-select";
import { RosterStatusList } from "@/components/assessment/roster-status-list";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getCategoriaEvaluationRoster } from "@/server/evaluation";
import { activeSeason, currentProfile } from "@/server/players";
import { listCategories, listPeriods } from "@/server/settings";

function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

async function getCategoria(categoriaId: string) {
  const categories = await listCategories();
  return categories.find((c) => c.id === categoriaId) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoriaId: string }>;
}) {
  const { categoriaId } = await params;
  const categoria = await getCategoria(categoriaId);
  return { title: categoria ? `${categoria.nombre} · AFA Manager` : "AFA Manager" };
}

export default async function CategoriaAssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoriaId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { categoriaId } = await params;
  const t = await getTranslations("evaluation");
  const sp = await searchParams;

  const [categoria, season, profile] = await Promise.all([
    getCategoria(categoriaId),
    activeSeason(),
    currentProfile(),
  ]);
  if (!categoria || !season || !profile) notFound();

  const periods = await listPeriods(season.id);
  if (periods.length === 0) notFound();

  const requested = str(sp.period);
  const selected =
    periods.find((p) => p.id === requested) ??
    periods.find((p) => !p.cerrado) ??
    periods[periods.length - 1];

  const roster = await getCategoriaEvaluationRoster(categoriaId, selected.id, profile.id);

  return (
    <div className="space-y-5">
      <Link
        href="/assessment"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <PageHeader title={categoria.nombre} />
      <PeriodSelect
        periods={periods.map((p) => ({ id: p.id, nombre: p.nombre }))}
        selectedId={selected.id}
      />

      <Card>
        <CardTitle extra={roster.length > 0 ? String(roster.length) : undefined}>
          {t("title")}
        </CardTitle>
        <RosterStatusList
          categoriaId={categoriaId}
          periodId={selected.id}
          roster={roster}
        />
      </Card>
    </div>
  );
}
