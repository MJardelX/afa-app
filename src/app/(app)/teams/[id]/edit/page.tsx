import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { TeamForm } from "@/components/teams/team-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { activeCategories, currentProfile, isAdmin } from "@/server/players";
import { getTeam, teamStaff } from "@/server/teams";

export async function generateMetadata() {
  const t = await getTranslations("teams");
  return { title: `${t("editTitle")} · AFA Manager` };
}

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("teams");
  const profile = await currentProfile();

  if (!isAdmin(profile?.rol)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted">{t("adminOnly")}</p>
        <Link
          href={`/teams/${id}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-legible hover:underline"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
      </div>
    );
  }

  const [team, categories, staff] = await Promise.all([
    getTeam(id),
    activeCategories(),
    teamStaff(),
  ]);
  if (!team) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader
        title={t("editTitle")}
        action={
          <Link
            href={`/teams/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </Link>
        }
      />
      <Card>
        <TeamForm
          mode="edit"
          categories={categories}
          staff={staff}
          team={{
            id: team.id,
            nombre: team.nombre,
            categoria_id: team.categoria_id,
            entrenador_id: team.entrenador_id,
            auxiliar_id: team.auxiliar_id,
            activo: team.activo,
          }}
        />
      </Card>
    </div>
  );
}
