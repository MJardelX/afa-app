import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { AttendanceRoster } from "@/components/attendance/attendance-roster";
import { SessionDetailPanel } from "@/components/attendance/session-detail-panel";
import { Card, CardTitle } from "@/components/ui/card";
import { currentProfile } from "@/server/players";
import {
  canManageSession,
  getSession,
  getSessionAttendance,
  getSessionRoster,
} from "@/server/attendance";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await getSession(id);
  return {
    title: s ? `${s.tipo === "entrenamiento" ? s.categoria : s.equipo} · AFA Manager` : "AFA Manager",
  };
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("attendance");
  const locale = await getLocale();

  const [session, profile] = await Promise.all([
    getSession(id),
    currentProfile(),
  ]);
  if (!session) notFound();

  const manage = await canManageSession(
    { categoriaId: session.categoriaId, equipoId: session.equipoId },
    profile,
  );

  const [roster, attendance] = manage
    ? await Promise.all([
        getSessionRoster(
          {
            categoriaId: session.categoriaId,
            equipoId: session.equipoId,
            fecha: session.fecha,
          },
          session.temporadaId,
        ),
        getSessionAttendance(id),
      ])
    : [[], []];

  return (
    <div className="space-y-5">
      <Link
        href="/attendance"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {t("title")}
      </Link>

      <SessionDetailPanel
        session={{
          id: session.id,
          tipo: session.tipo,
          categoriaId: session.categoriaId,
          categoria: session.categoria,
          equipoId: session.equipoId,
          equipo: session.equipo,
          fecha: session.fecha,
          horaInicio: session.horaInicio,
          horaFin: session.horaFin,
          lugar: session.lugar,
          rival: session.rival,
          notas: session.notas,
          color: session.color,
          estado: session.estado,
        }}
        manage={manage}
        locale={locale}
      />

      {manage && (
        <Card>
          <CardTitle extra={roster.length > 0 ? String(roster.length) : undefined}>
            {t("roster")}
          </CardTitle>
          <AttendanceRoster
            sessionId={id}
            roster={roster.map((p) => ({
              jugadorId: p.jugadorId,
              nombre: `${p.nombres} ${p.apellidos}`.trim(),
              codigo: p.codigo,
              equipo: p.equipo,
            }))}
            existing={attendance}
            isMatch={session.tipo !== "entrenamiento"}
          />
        </Card>
      )}
    </div>
  );
}
