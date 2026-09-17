"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";

import {
  actualizarCriterio,
  cambiarEstadoCriterio,
  crearCriterio,
  eliminarCriterio,
  type SettingsState,
} from "@/app/(app)/settings/actions";
import { DIMENSIONS } from "@/lib/schemas/settings";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Field, Select, Textarea, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { IconAction, iconActionClasses } from "@/components/ui/icon-action";
import { ListPagination, usePagedList } from "@/components/ui/list-pagination";
import { SubmitButton } from "@/components/ui/submit-button";

type Criterion = {
  id: string;
  dimension: (typeof DIMENSIONS)[number];
  nombre: string;
  descripcion: string | null;
  peso: number;
  escala_max: number;
  orden: number;
  activo: boolean;
  rubrica: Record<string, string> | null;
};

const DIM_KEY = {
  tecnica: "dimTecnica",
  tactica: "dimTactica",
  fisica: "dimFisica",
  actitudinal: "dimActitudinal",
} as const;

function anchors(c: Pick<Criterion, "escala_max" | "rubrica">) {
  const mid = Math.ceil(c.escala_max / 2);
  const r = c.rubrica ?? {};
  return {
    min: r["1"] ?? "",
    mid: r[String(mid)] ?? "",
    max: r[String(c.escala_max)] ?? "",
  };
}

export function CriteriaManager({
  rows,
  admin,
}: {
  rows: Criterion[];
  admin: boolean;
}) {
  const t = useTranslations("settings");
  const [creating, setCreating] = useState(false);

  const groups = DIMENSIONS.map((d) => ({
    dimension: d,
    items: rows.filter((c) => c.dimension === d),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">{t("criEmpty")}</p>
      ) : (
        groups.map((g) => (
          <section key={g.dimension} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">
              {t(DIM_KEY[g.dimension])}
            </h3>
            <CriteriaGroup items={g.items} admin={admin} />
          </section>
        ))
      )}

      {admin &&
        (creating ? (
          <CriterionForm mode="create" onDone={() => setCreating(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Plus className="size-3.5" />
            {t("criNew")}
          </button>
        ))}
    </div>
  );
}

function CriteriaGroup({ items, admin }: { items: Criterion[]; admin: boolean }) {
  const { page, setPage, pageCount, pageItems } = usePagedList(items);

  return (
    <>
      <ul className="divide-y divide-line">
        {pageItems.map((c) => (
          <CriterionRow key={c.id} criterion={c} admin={admin} />
        ))}
      </ul>
      <ListPagination page={page} pageCount={pageCount} onChange={setPage} />
    </>
  );
}

function CriterionRow({
  criterion,
  admin,
}: {
  criterion: Criterion;
  admin: boolean;
}) {
  const t = useTranslations("settings");
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="py-2.5">
        <CriterionForm
          mode="edit"
          criterion={criterion}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0">
      <span className="w-6 shrink-0 text-center text-xs tabular-nums text-faint">
        {criterion.orden}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{criterion.nombre}</span>
          <span className="text-xs text-faint">
            ×{criterion.peso} · 1–{criterion.escala_max}
          </span>
          {!criterion.activo && (
            <Badge tone="warn">{t("criInactive")}</Badge>
          )}
        </div>
        {criterion.descripcion && (
          <p className="mt-0.5 text-xs text-muted">{criterion.descripcion}</p>
        )}
      </div>

      {admin && (
        <div className="flex items-center gap-1">
          <form action={cambiarEstadoCriterio}>
            <input type="hidden" name="id" value={criterion.id} />
            <input
              type="hidden"
              name="activo"
              value={criterion.activo ? "false" : "true"}
            />
            <IconAction
              type="submit"
              label={criterion.activo ? t("deactivate") : t("activate")}
              tone={criterion.activo ? "muted" : "brand"}
            >
              <Power className="size-4" />
            </IconAction>
          </form>
          <IconAction label={t("edit")} onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
          </IconAction>
          <form action={eliminarCriterio}>
            <input type="hidden" name="id" value={criterion.id} />
            <ConfirmButton
              question={t("criDeleteConfirm")}
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

function CriterionForm({
  mode,
  criterion,
  onDone,
}: {
  mode: "create" | "edit";
  criterion?: Criterion;
  onDone: () => void;
}) {
  const t = useTranslations("settings");
  const action = mode === "create" ? crearCriterio : actualizarCriterio;
  const [state, formAction] = useActionState<SettingsState, FormData>(
    action,
    null,
  );
  const errs = state?.fieldErrors ?? {};
  const a = criterion
    ? anchors(criterion)
    : { min: "", mid: "", max: "" };

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state?.ok, onDone]);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-3"
    >
      {mode === "edit" && (
        <input type="hidden" name="id" value={criterion!.id} />
      )}
      <FormBanner error={state?.error} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t("criDimension")}
          htmlFor="cri-dim"
          error={errs.dimension}
        >
          <Select
            id="cri-dim"
            name="dimension"
            defaultValue={criterion?.dimension ?? "tecnica"}
          >
            {DIMENSIONS.map((d) => (
              <option key={d} value={d}>
                {t(DIM_KEY[d])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("criOrder")} htmlFor="cri-orden" error={errs.orden}>
          <TextInput
            id="cri-orden"
            name="orden"
            inputMode="numeric"
            defaultValue={criterion?.orden ?? 0}
            invalid={!!errs.orden}
          />
        </Field>
        <Field
          label={t("criName")}
          htmlFor="cri-nombre"
          error={errs.nombre}
          className="sm:col-span-2"
        >
          <TextInput
            id="cri-nombre"
            name="nombre"
            defaultValue={criterion?.nombre}
            invalid={!!errs.nombre}
            autoComplete="off"
            autoFocus
          />
        </Field>
        <Field
          label={t("criDescription2")}
          htmlFor="cri-desc"
          error={errs.descripcion}
          className="sm:col-span-2"
        >
          <Textarea
            id="cri-desc"
            name="descripcion"
            rows={2}
            defaultValue={criterion?.descripcion ?? ""}
          />
        </Field>
        <Field label={t("criWeight")} htmlFor="cri-peso" error={errs.peso}>
          <TextInput
            id="cri-peso"
            name="peso"
            inputMode="decimal"
            defaultValue={criterion?.peso ?? 1}
            invalid={!!errs.peso}
          />
        </Field>
        <Field
          label={t("criScale")}
          htmlFor="cri-escala"
          error={errs.escala_max}
        >
          <TextInput
            id="cri-escala"
            name="escala_max"
            inputMode="numeric"
            defaultValue={criterion?.escala_max ?? 5}
            invalid={!!errs.escala_max}
          />
        </Field>
      </div>

      <fieldset className="space-y-2 rounded-lg border border-line p-3">
        <legend className="px-1 text-xs font-medium">{t("criRubric")}</legend>
        <p className="text-xs text-muted">{t("criRubricHint")}</p>
        <Field label={t("criRubricMin")} htmlFor="cri-rmin">
          <Textarea
            id="cri-rmin"
            name="rubrica_min"
            rows={2}
            defaultValue={a.min}
          />
        </Field>
        <Field label={t("criRubricMid")} htmlFor="cri-rmid">
          <Textarea
            id="cri-rmid"
            name="rubrica_mid"
            rows={2}
            defaultValue={a.mid}
          />
        </Field>
        <Field label={t("criRubricMax")} htmlFor="cri-rmax">
          <Textarea
            id="cri-rmax"
            name="rubrica_max"
            rows={2}
            defaultValue={a.max}
          />
        </Field>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
        <input
          type="checkbox"
          name="activo"
          value="on"
          defaultChecked={criterion?.activo ?? true}
          className="size-4 rounded border-line text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
        />
        <span className="font-medium">{t("criActive")}</span>
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
