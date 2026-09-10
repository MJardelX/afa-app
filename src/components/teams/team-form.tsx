"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  actualizarEquipo,
  crearEquipo,
  type TeamFormState,
} from "@/app/(app)/teams/actions";
import { buttonClasses } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";

export type TeamFormData = {
  id: string;
  nombre: string;
  categoria_id: string;
  entrenador_id: string | null;
  auxiliar_id: string | null;
  activo: boolean;
};

type Option = { id: string; nombre: string };
type StaffOption = { id: string; nombre_completo: string };

export function TeamForm({
  mode,
  team,
  categories,
  staff,
  defaultCategoria,
}: {
  mode: "create" | "edit";
  team?: TeamFormData;
  categories: Option[];
  staff: StaffOption[];
  defaultCategoria?: string;
}) {
  const t = useTranslations("teams");
  const tc = useTranslations("common");

  const action = mode === "create" ? crearEquipo : actualizarEquipo;
  const [state, formAction] = useActionState<TeamFormState, FormData>(
    action,
    null,
  );
  const errs = state?.fieldErrors ?? {};
  const active = mode === "create" ? true : (team?.activo ?? true);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && <input type="hidden" name="id" value={team!.id} />}
      <FormBanner error={state?.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("fCategory")}
          htmlFor="categoria_id"
          required
          error={errs.categoria_id}
          hint={t("scheduleHint")}
        >
          <Select
            id="categoria_id"
            name="categoria_id"
            defaultValue={team?.categoria_id ?? defaultCategoria ?? ""}
            invalid={!!errs.categoria_id}
          >
            <option value="" disabled>
              {tc("choose")}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t("fName")} htmlFor="nombre" required error={errs.nombre}>
          <TextInput
            id="nombre"
            name="nombre"
            defaultValue={team?.nombre}
            placeholder={t("fNamePlaceholder")}
            invalid={!!errs.nombre}
            autoComplete="off"
            autoFocus={mode === "create"}
          />
        </Field>

        <Field label={t("fCoach")} htmlFor="entrenador_id">
          <Select
            id="entrenador_id"
            name="entrenador_id"
            defaultValue={team?.entrenador_id ?? ""}
          >
            <option value="">{t("fCoachNone")}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre_completo}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t("fAssistant")} htmlFor="auxiliar_id">
          <Select
            id="auxiliar_id"
            name="auxiliar_id"
            defaultValue={team?.auxiliar_id ?? ""}
          >
            <option value="">{t("fCoachNone")}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre_completo}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
        <input
          type="checkbox"
          name="activo"
          value="on"
          defaultChecked={active}
          className="size-4 rounded border-line text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
        />
        <span className="font-medium">{t("fActive")}</span>
      </label>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Link
          href={mode === "edit" ? `/teams/${team!.id}` : "/teams"}
          className={buttonClasses("ghost", "md")}
        >
          {tc("cancel")}
        </Link>
        <SubmitButton pendingLabel={tc("saving")}>{tc("save")}</SubmitButton>
      </div>
    </form>
  );
}
