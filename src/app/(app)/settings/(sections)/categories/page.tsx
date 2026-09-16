import { getTranslations } from "next-intl/server";

import { CategoriesManager } from "@/components/settings/categories-manager";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { currentProfile, isAdmin } from "@/server/players";
import { listCategories } from "@/server/settings";
import { teamStaff } from "@/server/teams";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("catTitle")} · AFA Manager` };
}

export default async function CategoriesSettingsPage() {
  const t = await getTranslations("settings");
  const [rows, profile, staff] = await Promise.all([
    listCategories(),
    currentProfile(),
    teamStaff(),
  ]);
  const admin = isAdmin(profile?.rol);

  return (
    <div className="space-y-4">
      <PageHeader title={t("catTitle")} description={t("catDescription")} />
      <Card>
        <CategoriesManager rows={rows} admin={admin} staff={staff} />
      </Card>
    </div>
  );
}
