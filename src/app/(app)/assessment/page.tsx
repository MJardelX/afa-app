import { getTranslations } from "next-intl/server";
import { ClipboardList } from "lucide-react";

import { CategoriaEvalCard } from "@/components/assessment/categoria-eval-card";
import { PeriodSelect } from "@/components/assessment/period-select";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { canEvaluatePlayer, listCategoriaEvaluationCounts } from "@/server/evaluation";
import { activeSeason, currentProfile } from "@/server/players";
import { listCategories, listPeriods } from "@/server/settings";

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

  // Any coach/director/coordinador can evaluate any training group — same
  // rule as who can run its training sessions or take its attendance.
  const allCategories = await listCategories();
  const categories = canEvaluatePlayer(profile)
    ? allCategories.filter((c) => c.activa)
    : [];

  const counts = profile
    ? await listCategoriaEvaluationCounts(
        categories.map((c) => c.id),
        selected.id,
        profile.id,
      )
    : new Map();

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <PeriodSelect
        periods={periods.map((p) => ({ id: p.id, nombre: p.nombre }))}
        selectedId={selected.id}
      />

      {categories.length === 0 ? (
        <EmptyState icon={<ClipboardList strokeWidth={1.5} />} title={t("teamsEmpty")} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {categories.map((c) => (
            <CategoriaEvalCard
              key={c.id}
              categoria={{ id: c.id, nombre: c.nombre, color: c.color }}
              periodId={selected.id}
              summary={counts.get(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
