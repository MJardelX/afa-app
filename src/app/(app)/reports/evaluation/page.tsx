import { getTranslations } from "next-intl/server";
import { Trophy } from "lucide-react";

import { PeriodSelect } from "@/components/assessment/period-select";
import { EvaluationRankingList } from "@/components/reports/evaluation-ranking-list";
import { ReportsNav } from "@/components/reports/reports-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { activeSeason } from "@/server/players";
import { listEvaluationRanking, type EvaluationRankRow } from "@/server/reports";
import { listPeriods } from "@/server/settings";

function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export async function generateMetadata() {
  const t = await getTranslations("reports");
  return { title: t("evaluationMetaTitle") };
}

export default async function EvaluationReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("reports");
  const sp = await searchParams;
  const season = await activeSeason();

  if (!season) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("title")} description={t("evaluationDescription")} />
        <ReportsNav />
        <EmptyState icon={<Trophy strokeWidth={1.5} />} title={t("noSeason")} />
      </div>
    );
  }

  const periods = await listPeriods(season.id);
  if (periods.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("title")} description={t("evaluationDescription")} />
        <ReportsNav />
        <EmptyState icon={<Trophy strokeWidth={1.5} />} title={t("noPeriods")} />
      </div>
    );
  }

  const requested = str(sp.period);
  const selected =
    periods.find((p) => p.id === requested) ??
    periods.find((p) => !p.cerrado) ??
    periods[periods.length - 1];

  const rows = await listEvaluationRanking(selected.id);

  const groups = new Map<
    string,
    { categoria: string; color: string; rows: EvaluationRankRow[] }
  >();
  for (const r of rows) {
    const key = r.categoriaId ?? "—";
    if (!groups.has(key)) {
      groups.set(key, {
        categoria: r.categoria ?? t("noCategory"),
        color: r.categoriaColor,
        rows: [],
      });
    }
    groups.get(key)!.rows.push(r);
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("evaluationDescription")} />
      <ReportsNav />
      <PeriodSelect
        periods={periods.map((p) => ({ id: p.id, nombre: p.nombre }))}
        selectedId={selected.id}
      />

      {groups.size === 0 ? (
        <EmptyState icon={<Trophy strokeWidth={1.5} />} title={t("evaluationEmpty")} />
      ) : (
        <div className="space-y-6">
          {[...groups.values()].map((g) => (
            <section key={g.categoria} className="space-y-3">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: g.color }}
                />
                {g.categoria}
              </h2>
              <EvaluationRankingList rows={g.rows} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
