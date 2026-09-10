import { getTranslations } from "next-intl/server";

import { SeasonsManager } from "@/components/settings/seasons-manager";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { currentProfile, isAdmin } from "@/server/players";
import { listSeasons } from "@/server/settings";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("seaTitle")} · AFA Manager` };
}

export default async function SeasonsSettingsPage() {
  const t = await getTranslations("settings");
  const [rows, profile] = await Promise.all([listSeasons(), currentProfile()]);
  const admin = isAdmin(profile?.rol);

  return (
    <div className="space-y-4">
      <PageHeader title={t("seaTitle")} description={t("seaDescription")} />
      <Card>
        <SeasonsManager rows={rows} admin={admin} />
      </Card>
    </div>
  );
}
