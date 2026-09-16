"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil, RotateCcw } from "lucide-react";

import { cambiarEstadoSesion } from "@/app/(app)/attendance/actions";
import { SessionForm, type SessionFormData } from "@/components/attendance/session-form";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Detail, DetailList } from "@/components/ui/detail-list";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate } from "@/lib/format";

const TYPE_KEY = {
  entrenamiento: "typeEntrenamiento",
  partido: "typePartido",
  amistoso: "typeAmistoso",
  torneo: "typeTorneo",
} as const;

const STATUS_KEY = {
  programada: "statusProgramada",
  realizada: "statusRealizada",
  suspendida: "statusSuspendida",
  cancelada: "statusCancelada",
} as const;

const STATUS_TONE: Record<string, BadgeTone> = {
  programada: "brand",
  realizada: "good",
  suspendida: "warn",
  cancelada: "danger",
};

/** Same pill shape/size as the other action buttons, quiet until hovered. */
const dangerActionClass =
  "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[0.8rem] font-medium text-muted ring-1 ring-inset ring-line transition-colors hover:bg-danger-bg hover:text-danger hover:ring-danger/30";

export function SessionDetailPanel({
  session,
  manage,
  locale,
}: {
  session: SessionFormData & { color: string; estado: string };
  manage: boolean;
  locale: string;
}) {
  const t = useTranslations("attendance");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const training = session.tipo === "entrenamiento";

  if (editing) {
    return (
      <Card>
        <CardTitle>{t("editTitle")}</CardTitle>
        <SessionForm mode="edit" session={session} onDone={() => setEditing(false)} />
      </Card>
    );
  }

  const typeKey = TYPE_KEY[session.tipo as keyof typeof TYPE_KEY];
  const statusKey = STATUS_KEY[session.estado as keyof typeof STATUS_KEY];

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: session.color }}
            />
            <h1 className="text-lg font-semibold tracking-tight">
              {training ? session.categoria : (session.equipo ?? session.categoria)}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted">
            {!training && `${session.categoria} · `}
            {typeKey ? t(typeKey) : ""}
            {session.rival ? ` · ${t("fRival")}: ${session.rival}` : ""}
          </p>
        </div>
        {statusKey && (
          <Badge tone={STATUS_TONE[session.estado]}>{t(statusKey)}</Badge>
        )}
      </div>

      <DetailList>
        <Detail term={t("fDate")}>{formatDate(session.fecha, locale)}</Detail>
        <Detail term={t("fStart")}>{session.horaInicio?.slice(0, 5) ?? "—"}</Detail>
        <Detail term={t("fEnd")}>{session.horaFin?.slice(0, 5) ?? "—"}</Detail>
        <Detail term={t("fPlace")}>{session.lugar ?? "—"}</Detail>
        {session.notas && <Detail term={t("fNotes")}>{session.notas}</Detail>}
      </DetailList>

      {manage && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={buttonClasses("secondary", "sm")}
          >
            <Pencil className="size-3.5" />
            {tc("edit")}
          </button>

          {session.estado === "programada" && (
            <StatusButton id={session.id} estado="realizada" variant="primary">
              <CircleCheck className="size-3.5" />
              {t("close")}
            </StatusButton>
          )}
          {session.estado !== "programada" && (
            <StatusButton id={session.id} estado="programada" variant="secondary">
              <RotateCcw className="size-3.5" />
              {t("reopen")}
            </StatusButton>
          )}

          {session.estado === "programada" && (
            <form action={cambiarEstadoSesion} className="ml-auto">
              <input type="hidden" name="id" value={session.id} />
              <input type="hidden" name="estado" value="cancelada" />
              <ConfirmButton
                question={t("cancelSessionConfirm")}
                confirmLabel={t("cancelSession")}
                cancelLabel={tc("cancel")}
                className={dangerActionClass}
              >
                <Ban className="size-3.5" />
                {t("cancelSession")}
              </ConfirmButton>
            </form>
          )}
        </div>
      )}
    </Card>
  );
}

function StatusButton({
  id,
  estado,
  variant,
  children,
}: {
  id: string;
  estado: "programada" | "realizada";
  variant: "primary" | "secondary" | "ghost";
  children: React.ReactNode;
}) {
  return (
    <form action={cambiarEstadoSesion}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <SubmitButton variant={variant} size="sm">
        {children}
      </SubmitButton>
    </form>
  );
}
