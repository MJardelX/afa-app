"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { HeartPulse, Pencil } from "lucide-react";

import {
  guardarFichaMedica,
  type MedicalState,
} from "@/app/(app)/players/medical-actions";
import { buttonClasses } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate } from "@/lib/format";

export type MedicalRecord = {
  alergias: string | null;
  enfermedades: string | null;
  medicamentos: string | null;
  observaciones: string | null;
  actualizado_en: string | null;
} | null;

export function MedicalSection({
  jugadorId,
  record,
  locale,
}: {
  jugadorId: string;
  record: MedicalRecord;
  locale: string;
}) {
  const t = useTranslations("players");
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <MedicalForm
        jugadorId={jugadorId}
        record={record}
        onDone={() => setEditing(false)}
      />
    );
  }

  const has =
    record &&
    (record.alergias ||
      record.enfermedades ||
      record.medicamentos ||
      record.observaciones);

  return (
    <div className="space-y-3">
      {!has ? (
        <p className="py-3 text-center text-sm text-muted">{t("medEmpty")}</p>
      ) : (
        <dl className="divide-y divide-line text-sm">
          <Row term={t("medAllergies")} value={record!.alergias} />
          <Row term={t("medDiseases")} value={record!.enfermedades} />
          <Row term={t("medMedications")} value={record!.medicamentos} />
          <Row term={t("medNotes")} value={record!.observaciones} />
        </dl>
      )}

      <div className="flex items-center justify-between gap-3">
        {record?.actualizado_en && (
          <span className="text-[0.7rem] text-faint">
            {t("medUpdated", { date: formatDate(record.actualizado_en, locale) })}
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          {has ? (
            <Pencil className="size-3.5" />
          ) : (
            <HeartPulse className="size-3.5" />
          )}
          {has ? t("medEdit") : t("medAdd")}
        </button>
      </div>
    </div>
  );
}

function Row({ term, value }: { term: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <dt className="text-xs font-medium text-muted">{term}</dt>
      <dd className="mt-0.5 whitespace-pre-line">{value}</dd>
    </div>
  );
}

function MedicalForm({
  jugadorId,
  record,
  onDone,
}: {
  jugadorId: string;
  record: MedicalRecord;
  onDone: () => void;
}) {
  const t = useTranslations("players");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<MedicalState, FormData>(
    guardarFichaMedica,
    null,
  );

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state?.ok, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="jugador_id" value={jugadorId} />
      <FormBanner error={state?.error} />

      <Field label={t("medAllergies")} htmlFor="alergias">
        <Textarea
          id="alergias"
          name="alergias"
          rows={2}
          defaultValue={record?.alergias ?? ""}
        />
      </Field>
      <Field label={t("medDiseases")} htmlFor="enfermedades">
        <Textarea
          id="enfermedades"
          name="enfermedades"
          rows={2}
          defaultValue={record?.enfermedades ?? ""}
        />
      </Field>
      <Field label={t("medMedications")} htmlFor="medicamentos">
        <Textarea
          id="medicamentos"
          name="medicamentos"
          rows={2}
          defaultValue={record?.medicamentos ?? ""}
        />
      </Field>
      <Field label={t("medNotes")} htmlFor="med_obs">
        <Textarea
          id="med_obs"
          name="observaciones"
          rows={3}
          defaultValue={record?.observaciones ?? ""}
        />
      </Field>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={onDone}
          className={buttonClasses("ghost", "sm")}
        >
          {tc("cancel")}
        </button>
        <SubmitButton size="sm" pendingLabel={tc("saving")}>
          {tc("save")}
        </SubmitButton>
      </div>
    </form>
  );
}
