"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  generarSesiones,
  type SessionState,
} from "@/app/(app)/attendance/actions";
import { buttonClasses } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import type { CalendarCategoryOption } from "@/components/attendance/types";
import { WEEKDAY_LABEL_KEY } from "@/lib/weekdays";

function isoToday(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function GenerateSessionsForm({
  categories,
  onDone,
}: {
  categories: CalendarCategoryOption[];
  onDone: () => void;
}) {
  const t = useTranslations("attendance");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<SessionState, FormData>(
    generarSesiones,
    null,
  );

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-3"
    >
      <FormBanner error={state?.error} />
      {state?.ok && (
        <p className="rounded-lg bg-status-good-bg px-3 py-2 text-xs text-status-good-fg">
          {state.count ? t("generateCreated", { count: state.count }) : t("generateNone")}
        </p>
      )}
      <p className="text-xs text-muted">{t("generateHint")}</p>

      <fieldset className="space-y-1.5">
        <legend className="text-xs font-medium">{t("generateCategories")}</legend>
        {categories.length === 0 ? (
          <p className="text-xs text-muted">{t("noCategories")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-subtle has-[:checked]:text-brand-legible"
              >
                <input
                  type="checkbox"
                  name="categoria_ids"
                  value={cat.id}
                  defaultChecked={!!cat.diasEntreno?.length}
                  className="size-3.5 rounded border-line text-brand"
                />
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.nombre}
                {cat.diasEntreno?.length ? (
                  <span className="text-faint">
                    ({cat.diasEntreno.map((d) => tc(WEEKDAY_LABEL_KEY[d] ?? d)).join(", ")})
                  </span>
                ) : (
                  <span className="text-faint">{t("noSchedule")}</span>
                )}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("generateStart")} htmlFor="gen-inicio">
          <TextInput
            id="gen-inicio"
            name="fecha_inicio"
            type="date"
            defaultValue={isoToday()}
          />
        </Field>
        <Field label={t("generateEnd")} htmlFor="gen-fin">
          <TextInput
            id="gen-fin"
            name="fecha_fin"
            type="date"
            defaultValue={isoToday(28)}
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
        <SubmitButton size="sm" disabled={categories.length === 0}>
          {t("generateSubmit")}
        </SubmitButton>
      </div>
    </form>
  );
}
