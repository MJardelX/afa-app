"use client";

import { useActionState, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Lock, Pencil, Plus, Star, Unlock } from "lucide-react";

import {
  activarTemporada,
  actualizarTemporada,
  alternarCierreTemporada,
  crearTemporada,
  type SettingsState,
} from "@/app/(app)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Field, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { IconAction, iconActionClasses } from "@/components/ui/icon-action";
import { ListPagination, usePagedList } from "@/components/ui/list-pagination";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate } from "@/lib/format";

type Season = {
  id: string;
  nombre: string;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  cerrada: boolean;
};

export function SeasonsManager({
  rows,
  admin,
}: {
  rows: Season[];
  admin: boolean;
}) {
  const t = useTranslations("settings");
  const [creating, setCreating] = useState(false);
  const { page, setPage, pageCount, pageItems } = usePagedList(rows);

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">{t("seaEmpty")}</p>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {pageItems.map((s) => (
              <SeasonRow key={s.id} season={s} admin={admin} />
            ))}
          </ul>
          <ListPagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}

      {admin &&
        (creating ? (
          <SeasonForm mode="create" onDone={() => setCreating(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Plus className="size-3.5" />
            {t("seaNew")}
          </button>
        ))}
    </div>
  );
}

function SeasonRow({ season, admin }: { season: Season; admin: boolean }) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="py-2.5">
        <SeasonForm
          mode="edit"
          season={season}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0">
      <span className="text-sm font-medium">{season.nombre}</span>
      {season.activa && <Badge tone="brand">{t("seaCurrent")}</Badge>}
      {season.cerrada && <Badge tone="neutral">{t("seaClosed")}</Badge>}
      <span className="text-xs text-muted">
        {formatDate(season.fecha_inicio, locale)} –{" "}
        {formatDate(season.fecha_fin, locale)}
      </span>

      {admin && (
        <div className="ml-auto flex items-center gap-1">
          {!season.activa && (
            <form action={activarTemporada}>
              <input type="hidden" name="id" value={season.id} />
              <ConfirmButton
                question={t("seaMakeActiveConfirm")}
                confirmLabel={t("seaMakeActive")}
                cancelLabel={t("cancel")}
                tone="brand"
                label={t("seaMakeActive")}
                className={iconActionClasses("brand")}
              >
                <Star className="size-4" />
              </ConfirmButton>
            </form>
          )}
          <form action={alternarCierreTemporada}>
            <input type="hidden" name="id" value={season.id} />
            <input
              type="hidden"
              name="cerrada"
              value={season.cerrada ? "false" : "true"}
            />
            <IconAction
              type="submit"
              label={season.cerrada ? t("seaReopen") : t("seaClose")}
              tone={season.cerrada ? "brand" : "muted"}
            >
              {season.cerrada ? (
                <Unlock className="size-4" />
              ) : (
                <Lock className="size-4" />
              )}
            </IconAction>
          </form>
          <IconAction label={t("edit")} onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
          </IconAction>
        </div>
      )}
    </li>
  );
}

function SeasonForm({
  mode,
  season,
  onDone,
}: {
  mode: "create" | "edit";
  season?: Season;
  onDone: () => void;
}) {
  const t = useTranslations("settings");
  const action = mode === "create" ? crearTemporada : actualizarTemporada;
  const [state, formAction] = useActionState<SettingsState, FormData>(
    action,
    null,
  );
  const errs = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state?.ok, onDone]);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-3"
    >
      {mode === "edit" && <input type="hidden" name="id" value={season!.id} />}
      <FormBanner error={state?.error} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("seaName")} htmlFor="sea-nombre" error={errs.nombre}>
          <TextInput
            id="sea-nombre"
            name="nombre"
            defaultValue={season?.nombre}
            invalid={!!errs.nombre}
            autoComplete="off"
            autoFocus
          />
        </Field>
        <Field label={t("seaYear")} htmlFor="sea-anio" error={errs.anio}>
          <TextInput
            id="sea-anio"
            name="anio"
            inputMode="numeric"
            defaultValue={season?.anio ?? new Date().getFullYear()}
            invalid={!!errs.anio}
          />
        </Field>
        <Field
          label={t("seaStart")}
          htmlFor="sea-inicio"
          error={errs.fecha_inicio}
        >
          <TextInput
            id="sea-inicio"
            name="fecha_inicio"
            type="date"
            defaultValue={season?.fecha_inicio}
            invalid={!!errs.fecha_inicio}
          />
        </Field>
        <Field label={t("seaEnd")} htmlFor="sea-fin" error={errs.fecha_fin}>
          <TextInput
            id="sea-fin"
            name="fecha_fin"
            type="date"
            defaultValue={season?.fecha_fin}
            invalid={!!errs.fecha_fin}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
          <input
            type="checkbox"
            name="activa"
            value="on"
            defaultChecked={season?.activa ?? false}
            className="size-4 rounded border-line text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
          />
          <span className="font-medium">{t("seaActive")}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
          <input
            type="checkbox"
            name="cerrada"
            value="on"
            defaultChecked={season?.cerrada ?? false}
            className="size-4 rounded border-line text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
          />
          <span className="font-medium">{t("seaClosed")}</span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className={buttonClasses("ghost", "sm")}
        >
          {t("cancel")}
        </button>
        <SubmitButton size="sm">{t("save")}</SubmitButton>
      </div>
    </form>
  );
}
