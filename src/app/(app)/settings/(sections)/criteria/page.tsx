import { getTranslations } from "next-intl/server";

import { CriteriaManager } from "@/components/settings/criteria-manager";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { currentProfile, isAdmin } from "@/server/players";
import { listCriteria } from "@/server/settings";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("criTitle")} · AFA Manager` };
}

export default async function CriteriaSettingsPage() {
  const t = await getTranslations("settings");
  const [rows, profile] = await Promise.all([listCriteria(), currentProfile()]);
  const admin = isAdmin(profile?.rol);

  return (
    <div className="space-y-4">
      <PageHeader title={t("criTitle")} description={t("criDescription")} />
      <Card>
        <CriteriaManager
          rows={rows.map((c) => ({
            ...c,
            rubrica: (c.rubrica ?? null) as Record<string, string> | null,
          }))}
          admin={admin}
        />
      </Card>
    </div>
  );
}
