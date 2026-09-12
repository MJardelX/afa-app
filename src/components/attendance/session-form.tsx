"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
  actualizarSesion,
  crearSesion,
  type SessionState,
} from "@/app/(app)/attendance/actions";
import { buttonClasses } from "@/components/ui/button";
import { Field, Select, Textarea, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { SESSION_TYPES } from "@/lib/schemas/attendance";

const TYPE_KEY = {
  entrenamiento: "typeEntrenamiento",
  partido: "typePartido",
  amistoso: "typeAmistoso",
  torneo: "typeTorneo",
} as const;

export type SessionFormData = {
  id: string;
  tipo: string;
  categoriaId: string | null;
  categoria: string;
  equipoId: string | null;
  equipo: string | null;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  lugar: string | null;
  rival: string | null;
  notas: string | null;
};

export type CategoryPickOption = { id: string; nombre: string };
export type TeamPickOption = { id: string; nombre: string; categoria: string };

export function SessionForm({
  mode,
  session,
  categories,
  teams,
  defaultDate,
  defaultCategoryId,
  onDone,
}: {
  mode: "create" | "edit";
  session?: SessionFormData;
  categories?: CategoryPickOption[];
  teams?: TeamPickOption[];
  defaultDate?: string;
  defaultCategoryId?: string;
  onDone: () => void;
}) {
  const t = useTranslations("attendance");
  const tc = useTranslations("common");
  const action = mode === "create" ? crearSesion : actualizarSesion;
  const [state, formAction] = useActionState<SessionState, FormData>(
    action,
    null,
  );
  const errs = state?.fieldErrors ?? {};
  const [tipo, setTipo] = useState(session?.tipo ?? "entrenamiento");
  const training = tipo === "entrenamiento";

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state?.ok, onDone]);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-3"
    >
      {mode === "edit" && <input type="hidden" name="id" value={session!.id} />}
      <FormBanner error={state?.error} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("fType")} htmlFor="ses-tipo" error={errs.tipo}>
          {mode === "create" ? (
            <Select
              id="ses-tipo"
              name="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {SESSION_TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {t(TYPE_KEY[ty])}
                </option>
              ))}
            </Select>
          ) : (
            <>
              <input type="hidden" name="tipo" value={tipo} />
              <p
                id="ses-tipo"
                className="flex h-10 items-center rounded-lg border border-line bg-surface-2 px-3 text-sm text-muted"
              >
                {t(TYPE_KEY[tipo as keyof typeof TYPE_KEY])}
              </p>
            </>
          )}
        </Field>

        {mode === "create" ? (
          training ? (
            <Field label={t("fCategory")} htmlFor="ses-categoria" error={errs.categoria_id}>
              <Select
                id="ses-categoria"
                name="categoria_id"
                defaultValue={defaultCategoryId ?? ""}
                invalid={!!errs.categoria_id}
              >
                <option value="" disabled>
                  {tc("choose")}
                </option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label={t("fTeam")} htmlFor="ses-equipo" error={errs.equipo_id}>
              <Select
                id="ses-equipo"
                name="equipo_id"
                defaultValue=""
                invalid={!!errs.equipo_id}
              >
                <option value="" disabled>
                  {tc("choose")}
                </option>
                {(teams ?? []).map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.nombre} · {tm.categoria}
                  </option>
                ))}
              </Select>
            </Field>
          )
        ) : (
          <Field
            label={training ? t("fCategory") : t("fTeam")}
            htmlFor="ses-scope-ro"
          >
            {training ? (
              <input type="hidden" name="categoria_id" value={session!.categoriaId ?? ""} />
            ) : (
              <input type="hidden" name="equipo_id" value={session!.equipoId ?? ""} />
            )}
            <p
              id="ses-scope-ro"
              className="flex h-10 items-center rounded-lg border border-line bg-surface-2 px-3 text-sm text-muted"
            >
              {training ? session!.categoria : session!.equipo}
            </p>
          </Field>
        )}

        <Field label={t("fDate")} htmlFor="ses-fecha" error={errs.fecha}>
          <TextInput
            id="ses-fecha"
            name="fecha"
            type="date"
            defaultValue={session?.fecha ?? defaultDate}
            invalid={!!errs.fecha}
          />
        </Field>
        <Field label={t("fStart")} htmlFor="ses-inicio">
          <TextInput
            id="ses-inicio"
            name="hora_inicio"
            type="time"
            defaultValue={session?.horaInicio?.slice(0, 5) ?? ""}
          />
        </Field>
        <Field label={t("fEnd")} htmlFor="ses-fin">
          <TextInput
            id="ses-fin"
            name="hora_fin"
            type="time"
            defaultValue={session?.horaFin?.slice(0, 5) ?? ""}
          />
        </Field>
        <Field label={t("fPlace")} htmlFor="ses-lugar">
          <TextInput
            id="ses-lugar"
            name="lugar"
            defaultValue={session?.lugar ?? ""}
            autoComplete="off"
          />
        </Field>
        {!training && (
          <Field label={t("fRival")} htmlFor="ses-rival">
            <TextInput
              id="ses-rival"
              name="rival"
              defaultValue={session?.rival ?? ""}
              autoComplete="off"
            />
          </Field>
        )}
        <Field label={t("fNotes")} htmlFor="ses-notas" className="sm:col-span-2">
          <Textarea
            id="ses-notas"
            name="notas"
            rows={2}
            defaultValue={session?.notas ?? ""}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className={buttonClasses("ghost", "sm")}
        >
          {tc("cancel")}
        </button>
        <SubmitButton size="sm">{tc("save")}</SubmitButton>
      </div>
    </form>
  );
}
