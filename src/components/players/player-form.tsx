"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  actualizarJugador,
  type PlayerFormState,
} from "@/app/(app)/players/actions";
import { buttonClasses } from "@/components/ui/button";
import { Field, Select, Textarea, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { categoryForAge, sportingAge } from "@/lib/format";
import { PLAYER_STATUSES } from "@/lib/schemas/player";

type Category = { id: string; nombre: string; edad_min: number; edad_max: number };

export type PlayerFormData = {
  id: string;
  codigo: string | null;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  lugar_nacimiento: string | null;
  direccion: string | null;
  fecha_ingreso: string | null;
  estado: string;
  observaciones: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

/** Edit form for an existing player. New players go through `PlayerWizard`. */
export function PlayerForm({
  categories,
  seasonYear,
  player,
}: {
  categories: Category[];
  seasonYear: number;
  player: PlayerFormData;
}) {
  const t = useTranslations("players");
  const tc = useTranslations("common");

  const [state, formAction] = useActionState<PlayerFormState, FormData>(
    actualizarJugador,
    null,
  );
  const errs = state?.fieldErrors ?? {};

  const [birth, setBirth] = useState(player.fecha_nacimiento ?? "");

  const preview = useMemo(() => {
    if (!birth || Number.isNaN(Date.parse(birth))) return null;
    const age = sportingAge(birth, seasonYear);
    return { age, cat: categoryForAge(age, categories) };
  }, [birth, seasonYear, categories]);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="id" value={player.id} />

      <FormBanner error={state?.error} />

      {/* Identity ------------------------------------------------------- */}
      <section className="space-y-4">
        <SectionTitle>{t("secData")}</SectionTitle>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("fFirstName")} htmlFor="nombres" required error={errs.nombres}>
            <TextInput
              id="nombres"
              name="nombres"
              defaultValue={player.nombres}
              invalid={!!errs.nombres}
              autoComplete="off"
            />
          </Field>
          <Field label={t("fLastName")} htmlFor="apellidos" required error={errs.apellidos}>
            <TextInput
              id="apellidos"
              name="apellidos"
              defaultValue={player.apellidos}
              invalid={!!errs.apellidos}
              autoComplete="off"
            />
          </Field>

          <Field
            label={t("fBirthDate")}
            htmlFor="fecha_nacimiento"
            required
            error={errs.fecha_nacimiento}
            hint={
              preview
                ? preview.cat
                  ? `${t("previewSportingAge", { age: preview.age })} · ${t("previewBelongs", { category: preview.cat.nombre })}`
                  : `${t("previewSportingAge", { age: preview.age })} · ${t("previewNoCategory")}`
                : undefined
            }
          >
            <TextInput
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              type="date"
              defaultValue={player.fecha_nacimiento}
              onChange={(e) => setBirth(e.target.value)}
              invalid={!!errs.fecha_nacimiento}
              max={today()}
            />
          </Field>
          <Field label={t("fBirthPlace")} htmlFor="lugar_nacimiento">
            <TextInput
              id="lugar_nacimiento"
              name="lugar_nacimiento"
              defaultValue={player.lugar_nacimiento ?? ""}
            />
          </Field>
        </div>
      </section>

      {/* Address / registration --------------------------------------- */}
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("fAddress")} htmlFor="direccion" className="sm:col-span-2">
            <TextInput id="direccion" name="direccion" defaultValue={player.direccion ?? ""} />
          </Field>
          <Field label={t("fJoinDate")} htmlFor="fecha_ingreso" error={errs.fecha_ingreso}>
            <TextInput
              id="fecha_ingreso"
              name="fecha_ingreso"
              type="date"
              defaultValue={player.fecha_ingreso ?? ""}
              max={today()}
            />
          </Field>
          <Field label={t("fStatus")} htmlFor="estado">
            <Select id="estado" name="estado" defaultValue={player.estado ?? "activo"}>
              {PLAYER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(
                    `status${s[0].toUpperCase()}${s.slice(1)}` as
                      | "statusActivo"
                      | "statusInactivo"
                      | "statusRetirado"
                      | "statusEgresado",
                  )}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      {/* Notes ----------------------------------------------------------- */}
      <section className="space-y-4">
        <Field label={t("fObservations")} htmlFor="observaciones">
          <Textarea
            id="observaciones"
            name="observaciones"
            rows={3}
            defaultValue={player.observaciones ?? ""}
          />
        </Field>
      </section>

      {/* Sticky actions ------------------------------------------------------ */}
      <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-2 border-t border-line bg-canvas/85 px-1 py-3 backdrop-blur">
        {player.codigo && (
          <span className="mr-auto text-xs tabular-nums text-muted">{player.codigo}</span>
        )}
        <Link href={`/players/${player.id}`} className={buttonClasses("ghost", "md")}>
          {tc("cancel")}
        </Link>
        <SubmitButton pendingLabel={tc("saving")}>{tc("save")}</SubmitButton>
      </div>
    </form>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-faint">
      {children}
    </h2>
  );
}
