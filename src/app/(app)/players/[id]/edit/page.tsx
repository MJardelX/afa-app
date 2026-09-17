import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { PlayerForm } from "@/components/players/player-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fullName } from "@/lib/format";
import {
  activeCategories,
  activeSeason,
  currentProfile,
  getPlayerEditable,
  isAdmin,
} from "@/server/players";

export async function generateMetadata() {
  const t = await getTranslations("players");
  return { title: `${t("editTitle")} · AFA Manager` };
}

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("players");

  const [profile, player, categories, season] = await Promise.all([
    currentProfile(),
    getPlayerEditable(id),
    activeCategories(),
    activeSeason(),
  ]);

  if (!player) notFound();

  if (!isAdmin(profile?.rol)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted">{t("adminOnly")}</p>
        <Link
          href={`/players/${id}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-legible hover:underline"
        >
          <ArrowLeft className="size-4" />
          {t("title")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader
        title={t("editTitle")}
        description={fullName(player)}
        action={
          <Link
            href={`/players/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="size-4" />
            {t("secData")}
          </Link>
        }
      />
      <Card>
        <PlayerForm
          categories={categories}
          seasonYear={season?.anio ?? new Date().getFullYear()}
          player={{
            id: player.id,
            codigo: player.codigo,
            nombres: player.nombres,
            apellidos: player.apellidos,
            fecha_nacimiento: player.fecha_nacimiento,
            sexo: player.sexo,
            lugar_nacimiento: player.lugar_nacimiento,
            direccion: player.direccion,
            fecha_ingreso: player.fecha_ingreso,
            estado: player.estado ?? "activo",
            observaciones: player.observaciones,
          }}
        />
      </Card>
    </div>
  );
}
