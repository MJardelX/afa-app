import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Pencil } from "lucide-react";

import { PlayerStatusBadge } from "@/components/players/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DataTable, Td, Th, Tr } from "@/components/ui/data-table";
import { Detail, DetailList } from "@/components/ui/detail-list";
import { currentProfile, isAdmin } from "@/server/players";
import { getTutor, tutorChildren } from "@/server/tutors";

function relKey(r: string) {
  return `rel${r[0].toUpperCase()}${r.slice(1)}` as
    | "relPadre"
    | "relMadre"
    | "relEncargado"
    | "relOtro";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tut = await getTutor(id);
  return {
    title: tut ? `${tut.nombres} ${tut.apellidos} · AFA Manager` : "AFA Manager",
  };
}

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("tutors");
  const tc = await getTranslations("common");

  const [tutor, profile, children] = await Promise.all([
    getTutor(id),
    currentProfile(),
    tutorChildren(id),
  ]);
  if (!tutor) notFound();
  const admin = isAdmin(profile?.rol);
  const name = `${tutor.nombres} ${tutor.apellidos}`;

  return (
    <div className="space-y-5">
      <Link
        href="/players/tutors"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <Card className="flex flex-wrap items-center gap-4">
        <Avatar name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold tracking-tight">{name}</h1>
          <p className="mt-1 text-sm text-muted">
            {tutor.telefono ?? tutor.email ?? tutor.dpi ?? "—"}
          </p>
        </div>
        {admin && (
          <Link
            href={`/players/tutors/${id}/edit`}
            className={buttonClasses("secondary", "sm")}
          >
            <Pencil className="size-3.5" />
            {tc("edit")}
          </Link>
        )}
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle>{t("secContact")}</CardTitle>
          <DetailList>
            <Detail term={t("fDpi")}>{tutor.dpi}</Detail>
            <Detail term={t("fPhone")}>{tutor.telefono}</Detail>
            <Detail term={t("fPhoneAlt")}>{tutor.telefono_alt}</Detail>
            <Detail term={t("fEmail")}>{tutor.email}</Detail>
            <Detail term={t("fOccupation")}>{tutor.ocupacion}</Detail>
            <Detail term={t("fWorkplace")}>{tutor.lugar_trabajo}</Detail>
            <Detail term={t("fAddress")}>{tutor.direccion}</Detail>
          </DetailList>
        </Card>

        <Card>
          <CardTitle extra={String(children.length)}>
            {t("secChildren")}
          </CardTitle>
          {children.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">
              {t("noChildren")}
            </p>
          ) : (
            <DataTable bare>
              <thead>
                <Tr head>
                  <Th>{t("colName")}</Th>
                  <Th>{t("colRelationship")}</Th>
                  <Th align="right">{t("colStatus")}</Th>
                </Tr>
              </thead>
              <tbody>
                {children.map((c) => {
                  const j = c.jugadores as {
                    nombres: string;
                    apellidos: string;
                    codigo: string;
                    estado: string;
                  } | null;
                  return (
                    <Tr key={c.jugador_id}>
                      <Td>
                        <Link
                          href={`/players/${c.jugador_id}`}
                          className="group block"
                        >
                          <span className="block truncate font-medium group-hover:text-brand-legible">
                            {j ? `${j.nombres} ${j.apellidos}` : "—"}
                          </span>
                          <span className="block truncate text-xs tabular-nums text-faint">
                            {j?.codigo}
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        <Badge
                          tone={c.es_contacto_principal ? "brand" : "neutral"}
                        >
                          {t(relKey(c.parentesco))}
                        </Badge>
                      </Td>
                      <Td align="right">
                        {j && <PlayerStatusBadge estado={j.estado} />}
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
