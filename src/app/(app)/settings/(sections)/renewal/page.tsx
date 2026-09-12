import { getTranslations } from "next-intl/server";

import { RenewalPanel } from "@/components/settings/renewal-panel";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { activeSeason } from "@/server/players";
import { listSeasons } from "@/server/settings";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("navRenewal")} · AFA Manager` };
}

export default async function RenewalSettingsPage() {
  const t = await getTranslations("settings");
  const [seasons, active] = await Promise.all([listSeasons(), activeSeason()]);
  const candidates = seasons.filter((s) => s.id !== active?.id);

  return (
    <div className="space-y-4">
      <PageHeader title={t("navRenewal")} description={t("renewalDescription")} />
      <Card>
        <RenewalPanel
          seasons={candidates.map((s) => ({ id: s.id, nombre: s.nombre }))}
          activeSeasonName={active?.nombre ?? null}
        />
      </Card>
    </div>
  );
}
