import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { TeamForm } from "@/components/teams/team-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { activeCategories, currentProfile, isAdmin } from "@/server/players";
import { teamStaff } from "@/server/teams";

export async function generateMetadata() {
  const t = await getTranslations("teams");
  return { title: `${t("newTitle")} · AFA Manager` };
}

export default async function NewTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const t = await getTranslations("teams");
  const [{ categoria }, profile] = await Promise.all([
    searchParams,
    currentProfile(),
  ]);

  if (!isAdmin(profile?.rol)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted">{t("adminOnly")}</p>
        <Link
          href="/teams"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-legible hover:underline"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
      </div>
    );
  }

  const [categories, staff] = await Promise.all([
    activeCategories(),
    teamStaff(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader
        title={t("newTitle")}
        action={
          <Link
            href="/teams"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </Link>
        }
      />
      <Card>
        <TeamForm
          mode="create"
          categories={categories}
          staff={staff}
          defaultCategoria={categoria}
        />
      </Card>
    </div>
  );
}
