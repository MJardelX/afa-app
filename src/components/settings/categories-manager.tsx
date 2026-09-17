"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarClock,
  CalendarPlus,
  MapPin,
  Pencil,
  Plus,
  Power,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  actualizarCategoria,
  cambiarEstadoCategoria,
  crearCategoria,
  eliminarCategoria,
  type SettingsState,
} from "@/app/(app)/settings/actions";
import { generarSesiones, type SessionState } from "@/app/(app)/attendance/actions";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Field, Select, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { IconAction, iconActionClasses } from "@/components/ui/icon-action";
import { ListPagination, usePagedList } from "@/components/ui/list-pagination";
import { SubmitButton } from "@/components/ui/submit-button";
import { monthBounds, monthParam, parseMonthParam } from "@/lib/calendar";
import { WEEKDAYS, WEEKDAY_LABEL_KEY } from "@/lib/weekdays";
import type { TeamStaff } from "@/server/teams";

type Category = {
  id: string;
  nombre: string;
  edad_min: number;
  edad_max: number;
  orden: number;
  color: string;
  dias_entreno: string[] | null;
  hora_entreno: string | null;
  lugar_entreno: string | null;
  activa: boolean;
  entrenador_id: string | null;
  auxiliar_id: string | null;
  entrenadorNombre: string | null;
  auxiliarNombre: string | null;
};

export function CategoriesManager({
  rows,
  admin,
  staff,
}: {
  rows: Category[];
  admin: boolean;
  staff: TeamStaff[];
}) {
  const t = useTranslations("settings");
  const [creating, setCreating] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const inactiveCount = rows.filter((c) => !c.activa).length;
  const visibleRows = showInactive ? rows : rows.filter((c) => c.activa);
  const { page, setPage, pageCount, pageItems } = usePagedList(visibleRows);

  return (
    <div className="space-y-4">
      {visibleRows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          {rows.length === 0 ? t("catEmpty") : t("catAllInactive")}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
            {pageItems.map((c) => (
              <CategoryCard key={c.id} category={c} admin={admin} staff={staff} />
            ))}
          </div>
          <ListPagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {admin &&
          (creating ? (
            <CategoryForm mode="create" staff={staff} onDone={() => setCreating(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <Plus className="size-3.5" />
              {t("catNew")}
            </button>
          ))}

        {inactiveCount > 0 && (
          <button
            type="button"
            onClick={() => setShowInactive((v) => !v)}
            className="text-xs font-medium text-muted underline-offset-2 hover:text-fg hover:underline"
          >
            {showInactive
              ? t("catHideInactive")
              : t("catShowInactive", { count: inactiveCount })}
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  admin,
  staff,
}: {
  category: Category;
  admin: boolean;
  staff: TeamStaff[];
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleteState, deleteAction] = useActionState<SettingsState, FormData>(
    eliminarCategoria,
    null,
  );

  if (editing) {
    return (
      <div className="col-span-full">
        <CategoryForm
          mode="edit"
          category={category}
          staff={staff}
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  if (generating) {
    return (
      <div className="col-span-full">
        <CategoryGenerateForm
          categoryId={category.id}
          onDone={() => setGenerating(false)}
        />
      </div>
    );
  }

  const days = (category.dias_entreno ?? [])
    .map((d) => (WEEKDAY_LABEL_KEY[d] ? tc(WEEKDAY_LABEL_KEY[d]) : d))
    .join(" · ");
  const time = category.hora_entreno?.slice(0, 5) ?? null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 transition-[border-color] duration-200 ease-out-soft hover:border-line-strong">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
            style={{ backgroundColor: category.color }}
          />
          <h3 className="truncate font-semibold">{category.nombre}</h3>
        </div>
        {!category.activa && <Badge tone="neutral">{t("catInactive")}</Badge>}
      </div>

      <FormBanner error={deleteState?.error} />

      <div>
        <Badge tone="neutral">
          {t("catRange", { min: category.edad_min, max: category.edad_max })}
        </Badge>
      </div>

      <dl className="space-y-1.5 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5 shrink-0" />
          <span className={days || time ? "" : "italic"}>
            {days || time ? [days, time].filter(Boolean).join("  ·  ") : t("catNoSchedule")}
          </span>
        </div>
        {category.lugar_entreno && (
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{category.lugar_entreno}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <UserRound className="size-3.5 shrink-0" />
          <span className={category.entrenadorNombre ? "" : "italic"}>
            {category.entrenadorNombre ?? t("catNoCoach")}
          </span>
        </div>
      </dl>

      {admin && (
        <div className="mt-auto flex items-center gap-1 border-t border-line pt-2.5">
          {!!category.dias_entreno?.length && (
            <IconAction
              label={t("catGenerate")}
              tone="brand"
              onClick={() => setGenerating(true)}
            >
              <CalendarPlus className="size-4" />
            </IconAction>
          )}
          <IconAction label={t("edit")} onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
          </IconAction>
          <form action={cambiarEstadoCategoria}>
            <input type="hidden" name="id" value={category.id} />
            <input
              type="hidden"
              name="activa"
              value={category.activa ? "false" : "true"}
            />
            <IconAction
              type="submit"
              label={category.activa ? t("deactivate") : t("activate")}
              tone={category.activa ? "muted" : "brand"}
            >
              <Power className="size-4" />
            </IconAction>
          </form>
          <form action={deleteAction} className="ml-auto">
            <input type="hidden" name="id" value={category.id} />
            <ConfirmButton
              question={t("catDeleteConfirm")}
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
    </div>
  );
}

function CategoryForm({
  mode,
  category,
  staff,
  onDone,
}: {
  mode: "create" | "edit";
  category?: Category;
  staff: TeamStaff[];
  onDone: () => void;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const action = mode === "create" ? crearCategoria : actualizarCategoria;
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
      {mode === "edit" && (
        <input type="hidden" name="id" value={category!.id} />
      )}
      <FormBanner error={state?.error} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("catName")} htmlFor="cat-nombre" error={errs.nombre}>
          <TextInput
            id="cat-nombre"
            name="nombre"
            defaultValue={category?.nombre}
            invalid={!!errs.nombre}
            autoComplete="off"
            autoFocus
          />
        </Field>
        <Field label={t("catOrder")} htmlFor="cat-orden" error={errs.orden}>
          <TextInput
            id="cat-orden"
            name="orden"
            inputMode="numeric"
            defaultValue={category?.orden ?? 0}
            invalid={!!errs.orden}
          />
        </Field>
        <Field
          label={t("catAgeMin")}
          htmlFor="cat-min"
          error={errs.edad_min}
        >
          <TextInput
            id="cat-min"
            name="edad_min"
            inputMode="numeric"
            defaultValue={category?.edad_min}
            invalid={!!errs.edad_min}
          />
        </Field>
        <Field
          label={t("catAgeMax")}
          htmlFor="cat-max"
          error={errs.edad_max}
        >
          <TextInput
            id="cat-max"
            name="edad_max"
            inputMode="numeric"
            defaultValue={category?.edad_max}
            invalid={!!errs.edad_max}
          />
        </Field>
        <Field label={t("catColor")} htmlFor="cat-color" error={errs.color}>
          <div className="flex items-center gap-2">
            <input
              id="cat-color"
              name="color"
              type="color"
              defaultValue={category?.color ?? "#0ea5e9"}
              className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-canvas p-1"
            />
            <span className="text-xs text-muted">{t("catColorHint")}</span>
          </div>
        </Field>
        <Field label={t("catTime")} htmlFor="cat-hora">
          <TextInput
            id="cat-hora"
            name="hora_entreno"
            type="time"
            defaultValue={category?.hora_entreno?.slice(0, 5) ?? ""}
          />
        </Field>
        <Field label={t("catPlace")} htmlFor="cat-lugar" className="sm:col-span-2">
          <TextInput
            id="cat-lugar"
            name="lugar_entreno"
            defaultValue={category?.lugar_entreno ?? ""}
            autoComplete="off"
          />
        </Field>
        <Field label={t("catCoach")} htmlFor="cat-entrenador">
          <Select
            id="cat-entrenador"
            name="entrenador_id"
            defaultValue={category?.entrenador_id ?? ""}
          >
            <option value="">{t("catNoCoach")}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre_completo}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("catAssistant")} htmlFor="cat-auxiliar">
          <Select
            id="cat-auxiliar"
            name="auxiliar_id"
            defaultValue={category?.auxiliar_id ?? ""}
          >
            <option value="">{t("catNoCoach")}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre_completo}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("catDays")}</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <label
              key={d}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-sm transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-subtle has-[:checked]:text-brand-legible"
            >
              <input
                type="checkbox"
                name="dias_entreno"
                value={d}
                defaultChecked={category?.dias_entreno?.includes(d) ?? false}
                className="size-4 rounded border-line text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
              />
              {tc(WEEKDAY_LABEL_KEY[d])}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
        <input
          type="checkbox"
          name="activa"
          value="on"
          defaultChecked={category?.activa ?? true}
          className="size-4 rounded border-line text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
        />
        <span className="font-medium">{t("catActive")}</span>
      </label>

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

/** Stamps a category's weekly schedule onto the calendar for one month. */
function CategoryGenerateForm({
  categoryId,
  onDone,
}: {
  categoryId: string;
  onDone: () => void;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const ta = useTranslations("attendance");
  const [state, formAction] = useActionState<SessionState, FormData>(
    generarSesiones,
    null,
  );
  const [month, setMonth] = useState(() => monthParam(parseMonthParam(undefined)));
  const { start, end } = monthBounds(month);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-3"
    >
      <input type="hidden" name="categoria_ids" value={categoryId} />
      <input type="hidden" name="fecha_inicio" value={start} />
      <input type="hidden" name="fecha_fin" value={end} />
      <FormBanner error={state?.error} />
      {state?.ok && (
        <p className="rounded-lg bg-status-good-bg px-3 py-2 text-xs text-status-good-fg">
          {state.count ? ta("generateCreated", { count: state.count }) : ta("generateNone")}
        </p>
      )}

      <Field label={t("catGenerateMonth")} htmlFor="cat-gen-month">
        <input
          id="cat-gen-month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-fg outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/12"
        />
      </Field>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className={buttonClasses("ghost", "sm")}
        >
          {tc("cancel")}
        </button>
        <SubmitButton size="sm">{ta("generateSubmit")}</SubmitButton>
      </div>
    </form>
  );
}
