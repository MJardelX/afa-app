import { getTranslations } from "next-intl/server";
import { Trophy } from "lucide-react";

import { AttendanceRankingList } from "@/components/reports/attendance-ranking-list";
import { ReportsNav } from "@/components/reports/reports-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { activeSeason } from "@/server/players";
import { listAttendanceRanking, type AttendanceRankRow } from "@/server/reports";

export async function generateMetadata() {
  const t = await getTranslations("reports");
  return { title: t("attendanceMetaTitle") };
}

export default async function AttendanceReportPage() {
  const t = await getTranslations("reports");
  const season = await activeSeason();

  if (!season) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("title")} description={t("attendanceDescription")} />
        <ReportsNav />
        <EmptyState icon={<Trophy strokeWidth={1.5} />} title={t("noSeason")} />
      </div>
    );
  }

  const rows = await listAttendanceRanking(season.id);

  const groups = new Map<
    string,
    { categoria: string; color: string; rows: AttendanceRankRow[] }
  >();
  for (const r of rows) {
    if (!groups.has(r.categoriaId)) {
      groups.set(r.categoriaId, { categoria: r.categoria, color: r.categoriaColor, rows: [] });
    }
    groups.get(r.categoriaId)!.rows.push(r);
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("attendanceDescription")} />
      <ReportsNav />

      {groups.size === 0 ? (
        <EmptyState icon={<Trophy strokeWidth={1.5} />} title={t("attendanceEmpty")} />
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
              <AttendanceRankingList rows={g.rows} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
