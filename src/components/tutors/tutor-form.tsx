"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  actualizarTutor,
  crearTutor,
  type TutorFormState,
} from "@/app/(app)/players/tutors/actions";
import { buttonClasses } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";

export type TutorFormData = {
  id: string;
  nombres: string;
  apellidos: string;
  dpi: string | null;
  telefono: string | null;
  telefono_alt: string | null;
  email: string | null;
  ocupacion: string | null;
  lugar_trabajo: string | null;
  direccion: string | null;
};

export function TutorForm({
  mode,
  tutor,
}: {
  mode: "create" | "edit";
  tutor?: TutorFormData;
}) {
  const t = useTranslations("tutors");
  const tc = useTranslations("common");

  const action = mode === "create" ? crearTutor : actualizarTutor;
  const [state, formAction] = useActionState<TutorFormState, FormData>(
    action,
    null,
  );
  const errs = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && <input type="hidden" name="id" value={tutor!.id} />}
      <FormBanner error={state?.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("fFirstName")} htmlFor="nombres" required error={errs.nombres}>
          <TextInput
            id="nombres"
            name="nombres"
            defaultValue={tutor?.nombres}
            invalid={!!errs.nombres}
            autoComplete="off"
            autoFocus={mode === "create"}
          />
        </Field>
        <Field label={t("fLastName")} htmlFor="apellidos" required error={errs.apellidos}>
          <TextInput
            id="apellidos"
            name="apellidos"
            defaultValue={tutor?.apellidos}
            invalid={!!errs.apellidos}
            autoComplete="off"
          />
        </Field>
        <Field label={t("fDpi")} htmlFor="dpi">
          <TextInput id="dpi" name="dpi" inputMode="numeric" defaultValue={tutor?.dpi ?? ""} />
        </Field>
        <Field label={t("fEmail")} htmlFor="email" error={errs.email}>
          <TextInput
            id="email"
            name="email"
            type="email"
            defaultValue={tutor?.email ?? ""}
            invalid={!!errs.email}
            autoComplete="off"
          />
        </Field>
        <Field label={t("fPhone")} htmlFor="telefono">
          <TextInput
            id="telefono"
            name="telefono"
            type="tel"
            inputMode="tel"
            defaultValue={tutor?.telefono ?? ""}
          />
        </Field>
        <Field label={t("fPhoneAlt")} htmlFor="telefono_alt">
          <TextInput
            id="telefono_alt"
            name="telefono_alt"
            type="tel"
            inputMode="tel"
            defaultValue={tutor?.telefono_alt ?? ""}
          />
        </Field>
        <Field label={t("fOccupation")} htmlFor="ocupacion">
          <TextInput
            id="ocupacion"
            name="ocupacion"
            defaultValue={tutor?.ocupacion ?? ""}
          />
        </Field>
        <Field label={t("fWorkplace")} htmlFor="lugar_trabajo">
          <TextInput
            id="lugar_trabajo"
            name="lugar_trabajo"
            defaultValue={tutor?.lugar_trabajo ?? ""}
          />
        </Field>
        <Field label={t("fAddress")} htmlFor="direccion" className="sm:col-span-2">
          <TextInput
            id="direccion"
            name="direccion"
            defaultValue={tutor?.direccion ?? ""}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Link
          href={mode === "edit" ? `/players/tutors/${tutor!.id}` : "/players/tutors"}
          className={buttonClasses("ghost", "md")}
        >
          {tc("cancel")}
        </Link>
        <SubmitButton pendingLabel={tc("saving")}>{tc("save")}</SubmitButton>
      </div>
    </form>
  );
}
