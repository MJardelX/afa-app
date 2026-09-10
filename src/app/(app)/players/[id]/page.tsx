import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Pencil } from "lucide-react";

import { cambiarEstadoJugador } from "@/app/(app)/players/actions";
import { EnrollmentSection } from "@/components/players/enrollment-section";
import { GuardiansSection } from "@/components/players/guardians-section";
import { MedicalSection } from "@/components/players/medical-section";
import { PlayerStatusBadge } from "@/components/players/status-badge";
import {
  AttendanceBadge,
  attendanceLevel,
} from "@/components/ui/attendance-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Detail, DetailList } from "@/components/ui/detail-list";
import { FormBanner } from "@/components/ui/form-banner";
import { InfoHint } from "@/components/ui/info-hint";
import { formatDate, fullName } from "@/lib/format";
import {
  activeCategories,
  currentProfile,
  getPlayer,
  getPlayerEditable,
  isAdmin,
  medicalRecord,
  playerAttendance,
  playerEvaluation,
} from "@/server/players";
import { playerGuardians } from "@/server/tutors";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getPlayer(id);
  return { title: p ? `${p.nombre_completo} · AFA Manager` : "AFA Manager" };
}

export default async function PlayerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const saved = (await searchParams).saved === "1";
  const t = await getTranslations("players");
  const tc = await getTranslations("common");
  const locale = await getLocale();

  const [player, extra, profile] = await Promise.all([
    getPlayer(id),
    getPlayerEditable(id),
    currentProfile(),
  ]);

  if (!player) notFound();
  const admin = isAdmin(profile?.rol);

  const [attendance, evaluation, guardians, medical, categories] =
    await Promise.all([
      playerAttendance(id, player.temporada_id),
      playerEvaluation(id),
      playerGuardians(id),
      admin ? medicalRecord(id) : Promise.resolve(null),
      activeCategories(),
    ]);

  const name = fullName(player);
  const retiring = player.estado === "activo";
  const categoryColor =
    categories.find(
      (c) => c.id === (player.categoria_id ?? player.categoria_por_edad_id),
    )?.color ?? null;

  return (
    <div className="space-y-5">
      <Link
        href="/players"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {t("title")}
      </Link>

      {saved && <FormBanner success={t("toastUpdated")} />}

      {/* Header ---------------------------------------------------------- */}
      <Card className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={name} size="lg" ringColor={categoryColor} />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-tight tracking-tight">
              {name}
            </h1>
            <p className="mt-1 text-xs tabular-nums text-faint">
              {player.codigo}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <PlayerStatusBadge estado={player.estado ?? "activo"} />
              {player.sin_inscribir ? (
                <Badge tone="neutral">{t("unenrolled")}</Badge>
              ) : player.categoria || player.categoria_por_edad ? (
                <Badge tone="neutral">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: categoryColor ?? "var(--line-strong)",
                    }}
                  />
                  {player.categoria ?? player.categoria_por_edad}
                  {player.fuera_de_categoria && (
                    <InfoHint
                      label={t("outOfCategory")}
                      text={
                        player.categoria_por_edad
                          ? t("outOfCategoryNote", {
                              current: player.categoria ?? "—",
                              expected: player.categoria_por_edad,
                            })
                          : t("noAgeCategoryNote", {
                              current: player.categoria ?? "—",
                            })
                      }
                    />
                  )}
                </Badge>
              ) : null}
              {player.sin_equipo && (
                <Badge tone="neutral">{t("noTeamYet")}</Badge>
              )}
            </div>
          </div>
        </div>

        {admin && (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/players/${id}/edit`}
              className={buttonClasses("secondary", "sm")}
            >
              <Pencil className="size-3.5" />
              {tc("edit")}
            </Link>
            <form action={cambiarEstadoJugador}>
              <input type="hidden" name="id" value={id} />
              <input
                type="hidden"
                name="estado"
                value={retiring ? "retirado" : "activo"}
              />
              <ConfirmButton
                question={retiring ? t("retireConfirm") : t("reactivateConfirm")}
                confirmLabel={retiring ? t("retire") : t("reactivate")}
                cancelLabel={tc("cancel")}
                tone={retiring ? "danger" : "brand"}
                className={buttonClasses("ghost", "sm")}
              >
                {retiring ? t("retire") : t("reactivate")}
              </ConfirmButton>
            </form>
          </div>
        )}
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardTitle>{t("secData")}</CardTitle>
            <DetailList>
              <Detail term={t("fBirthDate")}>
                {formatDate(player.fecha_nacimiento, locale)}
              </Detail>
              <Detail term={t("realAge")}>{player.edad_real}</Detail>
              <Detail term={t("sportingAgeLabel")}>
                {player.edad_deportiva}
              </Detail>
              <Detail term={t("fBirthPlace")}>
                {extra?.lugar_nacimiento}
              </Detail>
              {player.colegio && (
                <Detail term={t("fSchool")}>{player.colegio}</Detail>
              )}
              {extra?.grado_escolar && (
                <Detail term={t("fGrade")}>{extra.grado_escolar}</Detail>
              )}
              <Detail term={t("fAddress")}>{player.direccion}</Detail>
              <Detail term={t("fJoinDate")}>
                {formatDate(player.fecha_ingreso, locale)}
              </Detail>
            </DetailList>
            {extra?.observaciones && (
              <p className="mt-4 whitespace-pre-line rounded-lg bg-surface-2 p-3 text-sm text-muted">
                {extra.observaciones}
              </p>
            )}
          </Card>

          <Card>
            <CardTitle>{t("secEnrollment")}</CardTitle>
            <EnrollmentSection
              jugadorId={id}
              admin={admin}
              categories={categories}
              info={{
                sinInscribir: !!player.sin_inscribir,
                categoria: player.categoria,
                categoriaId: player.categoria_id,
                equipo: player.equipo,
                equipoId: player.equipo_id,
                equipoCategoria: player.equipo_categoria,
                equipoCategoriaDistinta: player.equipo_categoria_distinta,
                numeroCamiseta: player.numero_camiseta,
                posicion: player.posicion,
                fueraDeCategoria: player.fuera_de_categoria,
                categoriaPorEdad: player.categoria_por_edad,
                categoriaPorEdadId: player.categoria_por_edad_id,
                motivoExcepcion: player.motivo_excepcion,
              }}
            />
          </Card>

          <Card>
            <CardTitle
              extra={guardians.length > 0 ? String(guardians.length) : undefined}
            >
              {t("secTutors")}
            </CardTitle>
            <GuardiansSection
              jugadorId={id}
              admin={admin}
              guardians={guardians.map((g) => ({
                tutor_id: g.tutor_id!,
                parentesco: g.parentesco,
                es_contacto_principal: g.es_contacto_principal,
                autoriza_retiro: g.autoriza_retiro,
                tutores: g.tutores as {
                  id: string;
                  nombres: string;
                  apellidos: string;
                  telefono: string | null;
                } | null,
              }))}
            />
          </Card>

          {admin && (
            <Card>
              <CardTitle>{t("secMedical")}</CardTitle>
              <MedicalSection jugadorId={id} record={medical} locale={locale} />
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle>{t("secAttendance")}</CardTitle>
            {!attendance || attendance.sesiones_convocadas === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                {t("attNoData")}
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tabular-nums">
                    {attendance.porcentaje ?? 0}%
                  </span>
                  <AttendanceBadge
                    level={attendanceLevel(attendance.porcentaje ?? 0)}
                  />
                </div>
                <DetailList>
                  <Detail term={t("attCalledUp")}>
                    {attendance.sesiones_convocadas}
                  </Detail>
                  <Detail term={t("attPresent")}>{attendance.presentes}</Detail>
                  <Detail term={t("attAbsent")}>{attendance.ausentes}</Detail>
                </DetailList>
              </div>
            )}
          </Card>

          <Card>
            <CardTitle>{t("secEvaluation")}</CardTitle>
            {evaluation.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                {t("evalNoData")}
              </p>
            ) : (
              <DetailList>
                {evaluation.map((e) => (
                  <Detail key={e.dimension} term={e.dimension ?? "—"}>
                    <span className="tabular-nums">{e.promedio}</span>
                  </Detail>
                ))}
              </DetailList>
            )}
          </Card>
        </div>
      </div>

      {/* Tutors + medical record land here in the next increment. */}
    </div>
  );
}
