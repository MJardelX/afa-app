import { getTranslations } from "next-intl/server";

import { PeriodsManager } from "@/components/settings/periods-manager";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { currentProfile, isAdmin } from "@/server/players";
import { listPeriods, listSeasons } from "@/server/settings";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("perTitle")} · AFA Manager` };
}

function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function PeriodsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("settings");
  const [seasons, profile] = await Promise.all([listSeasons(), currentProfile()]);
  const admin = isAdmin(profile?.rol);

  const requested = str((await searchParams).season);
  const selected =
    seasons.find((s) => s.id === requested) ??
    seasons.find((s) => s.activa) ??
    seasons[0];

  const rows = selected ? await listPeriods(selected.id) : [];

  return (
    <div className="space-y-4">
      <PageHeader title={t("perTitle")} description={t("perDescription")} />
      <Card>
        {!selected ? (
          <p className="py-4 text-center text-sm text-muted">
            {t("perNoSeason")}
          </p>
        ) : (
          <PeriodsManager
            rows={rows}
            admin={admin}
            seasons={seasons.map((s) => ({ id: s.id, nombre: s.nombre }))}
            selectedSeasonId={selected.id}
          />
        )}
      </Card>
    </div>
  );
}
