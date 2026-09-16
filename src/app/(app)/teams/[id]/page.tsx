import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Pencil } from "lucide-react";

import { cambiarEstadoEquipo } from "@/app/(app)/teams/actions";
import { RosterManager } from "@/components/teams/roster-manager";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { DataTable, Td, Th, Tr } from "@/components/ui/data-table";
import { Detail, DetailList } from "@/components/ui/detail-list";
import { FormBanner } from "@/components/ui/form-banner";
import { WEEKDAY_LABEL_KEY } from "@/lib/weekdays";
import { currentProfile, isAdmin } from "@/server/players";
import { getTeamHeader, getTeamRoster } from "@/server/teams";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getTeamHeader(id);
  return { title: team ? `${team.nombre} · AFA Manager` : "AFA Manager" };
}

export default async function TeamRosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const saved = (await searchParams).saved === "1";
  const t = await getTranslations("teams");
  const tc = await getTranslations("common");
  const locale = await getLocale();

  const [team, profile] = await Promise.all([
    getTeamHeader(id),
    currentProfile(),
  ]);
  if (!team) notFound();
  const admin = isAdmin(profile?.rol);

  const roster = await getTeamRoster(id);

  const time = team.horaEntreno?.slice(0, 5) ?? null;
  const days = (team.diasEntreno ?? [])
    .map((d) => (WEEKDAY_LABEL_KEY[d] ? tc(WEEKDAY_LABEL_KEY[d]) : d))
    .join(" · ");
  const fmtDate = (v: string | null) =>
    v
      ? new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(v))
      : "—";

  return (
    <div className="space-y-5">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {t("title")}
      </Link>

      {saved && <FormBanner success={t("toastUpdated")} />}

      <Card className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">
              {team.nombre}
            </h1>
            <Badge tone="brand">{team.categoria}</Badge>
            {!team.activo && <Badge tone="neutral">{t("inactive")}</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">
            {team.coachName ?? t("noCoach")}
          </p>
        </div>

        {admin && (
          <div className="flex items-center gap-2">
            <Link
              href={`/teams/${id}/edit`}
              className={buttonClasses("secondary", "sm")}
            >
              <Pencil className="size-3.5" />
              {tc("edit")}
            </Link>
            <form action={cambiarEstadoEquipo}>
              <input type="hidden" name="id" value={id} />
              <input
                type="hidden"
                name="activo"
                value={team.activo ? "false" : "true"}
              />
              <ConfirmButton
                question={
                  team.activo ? t("deactivateConfirm") : t("activateConfirm")
                }
                confirmLabel={team.activo ? t("deactivate") : t("activate")}
                cancelLabel={tc("cancel")}
                tone={team.activo ? "danger" : "brand"}
                className={buttonClasses("ghost", "sm")}
              >
                {team.activo ? t("deactivate") : t("activate")}
              </ConfirmButton>
            </form>
          </div>
        )}
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardTitle>{t("colSchedule")}</CardTitle>
          <DetailList>
            <Detail term={t("fCategory")}>{team.categoria}</Detail>
            <Detail term={t("fCoach")}>{team.coachName ?? "—"}</Detail>
            <Detail term={t("fAssistant")}>{team.assistantName ?? "—"}</Detail>
            <Detail term={t("fDays")}>{days || "—"}</Detail>
            <Detail term={t("fTime")}>{time ?? "—"}</Detail>
            <Detail term={t("fPlace")}>{team.lugarEntreno ?? "—"}</Detail>
          </DetailList>
          {admin && (
            <Link
              href="/settings/categories"
              className="mt-3 block text-xs text-brand-legible hover:underline"
            >
              {t("scheduleEditHint")}
            </Link>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle extra={roster.length > 0 ? String(roster.length) : undefined}>
            {t("roster")}
          </CardTitle>

          {admin ? (
            <RosterManager
              teamId={id}
              teamCategoryId={team.categoria_id}
              teamEdadMin={team.edadMin}
              roster={roster.map((r) => ({
                inscripcionId: r.inscripcionId,
                jugadorId: r.jugadorId,
                numero: r.numero,
                posicion: r.posicion,
                fechaAltaLabel: fmtDate(r.fechaAlta),
                nombres: r.nombres,
                apellidos: r.apellidos,
                codigo: r.codigo,
              }))}
            />
          ) : roster.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              {t("rosterEmpty")}
            </p>
          ) : (
            <DataTable bare>
              <thead>
                <Tr head>
                  <Th align="center" className="w-10">
                    {t("colNumber")}
                  </Th>
                  <Th>{t("colName")}</Th>
                  <Th>{t("colPosition")}</Th>
                  <Th align="right">{t("since")}</Th>
                </Tr>
              </thead>
              <tbody>
                {roster.map((r) => {
                  const name = `${r.nombres} ${r.apellidos}`.trim();
                  return (
                    <Tr key={r.inscripcionId}>
                      <Td
                        align="center"
                        className="text-sm font-semibold tabular-nums text-muted"
                      >
                        {r.numero ?? "—"}
                      </Td>
                      <Td>
                        <Link
                          href={`/players/${r.jugadorId}`}
                          className="group flex items-center gap-3"
                        >
                          <Avatar name={name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium group-hover:text-brand-legible">
                              {name}
                            </span>
                            <span className="block truncate text-xs tabular-nums text-faint">
                              {r.codigo}
                            </span>
                          </span>
                        </Link>
                      </Td>
                      <Td className="text-xs text-muted">
                        {r.posicion ?? "—"}
                      </Td>
                      <Td align="right" className="text-xs text-faint">
                        {fmtDate(r.fechaAlta)}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </div>
  );
}
