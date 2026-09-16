"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { useLocale, useTranslations } from "next-intl";
import { Lock, Pencil, Plus, Trash2, Unlock } from "lucide-react";

import {
  actualizarPeriodo,
  alternarCierrePeriodo,
  crearPeriodo,
  eliminarPeriodo,
  type SettingsState,
} from "@/app/(app)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Field, Select, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { IconAction, iconActionClasses } from "@/components/ui/icon-action";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate } from "@/lib/format";

type Period = {
  id: string;
  temporada_id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  orden: number;
  cerrado: boolean;
};

type SeasonOption = { id: string; nombre: string };

export function PeriodsManager({
  rows,
  admin,
  seasons,
  selectedSeasonId,
}: {
  rows: Period[];
  admin: boolean;
  seasons: SeasonOption[];
  selectedSeasonId: string;
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted">{t("perSeason")}</span>
        <Select
          value={selectedSeasonId}
          onChange={(e) =>
            router.push(`/settings/periods?season=${e.target.value}`)
          }
          className="h-8 w-auto text-sm"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </Select>
      </label>

      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">{t("perEmpty")}</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((p) => (
            <PeriodRow key={p.id} period={p} admin={admin} />
          ))}
        </ul>
      )}

      {admin &&
        (creating ? (
          <PeriodForm
            mode="create"
            seasonId={selectedSeasonId}
            onDone={() => setCreating(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Plus className="size-3.5" />
            {t("perNew")}
          </button>
        ))}
    </div>
  );
}

function PeriodRow({ period, admin }: { period: Period; admin: boolean }) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="py-2.5">
        <PeriodForm
          mode="edit"
          seasonId={period.temporada_id}
          period={period}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0">
      <span className="w-6 shrink-0 text-center text-xs tabular-nums text-faint">
        {period.orden}
      </span>
      <span className="text-sm font-medium">{period.nombre}</span>
      {period.cerrado && <Badge tone="neutral">{t("perClosed")}</Badge>}
      <span className="text-xs text-muted">
        {formatDate(period.fecha_inicio, locale)} –{" "}
        {formatDate(period.fecha_fin, locale)}
      </span>

      {admin && (
        <div className="ml-auto flex items-center gap-1">
          <form action={alternarCierrePeriodo}>
            <input type="hidden" name="id" value={period.id} />
            <input
              type="hidden"
              name="cerrado"
              value={period.cerrado ? "false" : "true"}
            />
            <IconAction
              type="submit"
              label={period.cerrado ? t("perReopen") : t("perClose")}
              tone={period.cerrado ? "brand" : "muted"}
            >
              {period.cerrado ? (
                <Unlock className="size-4" />
              ) : (
                <Lock className="size-4" />
              )}
            </IconAction>
          </form>
          <IconAction label={t("edit")} onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
          </IconAction>
          <form action={eliminarPeriodo}>
            <input type="hidden" name="id" value={period.id} />
            <ConfirmButton
              question={t("perDeleteConfirm")}
              confirmLabel={t("delete")}
              cancelLabel={t("cancel")}
              label={t("delete")}
              className={iconActionClasses("danger")}
            >
              <Trash2 className="size-4" />
            </ConfirmButton>
          </form>
        </div>
      )}
    </li>
  );
}

function PeriodForm({
  mode,
  period,
  seasonId,
  onDone,
}: {
  mode: "create" | "edit";
  period?: Period;
  seasonId: string;
  onDone: () => void;
}) {
  const t = useTranslations("settings");
  const action = mode === "create" ? crearPeriodo : actualizarPeriodo;
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
      {mode === "edit" && <input type="hidden" name="id" value={period!.id} />}
      <input type="hidden" name="temporada_id" value={seasonId} />
      <FormBanner error={state?.error} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("perName")} htmlFor="per-nombre" error={errs.nombre}>
          <TextInput
            id="per-nombre"
            name="nombre"
            defaultValue={period?.nombre}
            invalid={!!errs.nombre}
            autoComplete="off"
            autoFocus
          />
        </Field>
        <Field label={t("perOrder")} htmlFor="per-orden" error={errs.orden}>
          <TextInput
            id="per-orden"
            name="orden"
            inputMode="numeric"
            defaultValue={period?.orden ?? 0}
            invalid={!!errs.orden}
          />
        </Field>
        <Field
          label={t("perStart")}
          htmlFor="per-inicio"
          error={errs.fecha_inicio}
        >
          <TextInput
            id="per-inicio"
            name="fecha_inicio"
            type="date"
            defaultValue={period?.fecha_inicio}
            invalid={!!errs.fecha_inicio}
          />
        </Field>
        <Field label={t("perEnd")} htmlFor="per-fin" error={errs.fecha_fin}>
          <TextInput
            id="per-fin"
            name="fecha_fin"
            type="date"
            defaultValue={period?.fecha_fin}
            invalid={!!errs.fecha_fin}
          />
        </Field>
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
