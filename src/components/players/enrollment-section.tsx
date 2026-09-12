"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Info, Pencil } from "lucide-react";

import {
  cambiarCategoriaInscripcion,
  type EnrollmentState,
} from "@/app/(app)/players/enrollment-actions";
import { buttonClasses } from "@/components/ui/button";
import { Detail, DetailList } from "@/components/ui/detail-list";
import { Field, Select, Textarea } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";

type Category = {
  id: string;
  nombre: string;
  edad_min: number;
  edad_max: number;
};

export type EnrollmentInfo = {
  sinInscribir: boolean;
  categoria: string | null;
  categoriaId: string | null;
  equipo: string | null;
  equipoId: string | null;
  equipoCategoria: string | null;
  equipoCategoriaDistinta: boolean | null;
  numeroCamiseta: number | null;
  posicion: string | null;
  fueraDeCategoria: boolean | null;
  categoriaPorEdad: string | null;
  categoriaPorEdadId: string | null;
  motivoExcepcion: string | null;
};

/**
 * The player's season enrollment. Category and team are independent: a player
 * can train with one category and be called up for matches by a team of
 * another. Admins can change the training category here; the team is managed
 * from the Teams module.
 */
export function EnrollmentSection({
  jugadorId,
  admin,
  info,
  categories,
}: {
  jugadorId: string;
  admin: boolean;
  info: EnrollmentInfo;
  categories: Category[];
}) {
  const t = useTranslations("players");
  const [editing, setEditing] = useState(false);

  if (info.sinInscribir) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {t("enrNone")}
        <span className="mt-1 block text-xs">{t("enrManage")}</span>
      </p>
    );
  }

  if (editing) {
    return (
      <CategoryForm
        jugadorId={jugadorId}
        info={info}
        categories={categories}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <DetailList>
        <Detail term={t("colCategory")}>{info.categoria ?? "—"}</Detail>
        <Detail term={t("enrTeam")}>
          {info.equipoId && info.equipo ? (
            <Link
              href={`/teams/${info.equipoId}`}
              className="text-brand-legible hover:underline"
            >
              {info.equipo}
            </Link>
          ) : (
            <span className="text-muted">{t("noTeamYet")}</span>
          )}
        </Detail>
        {info.equipoId && (
          <Detail term={t("enrShirt")}>{info.numeroCamiseta ?? "—"}</Detail>
        )}
        {info.equipoId && (
          <Detail term={t("enrPosition")}>{info.posicion ?? "—"}</Detail>
        )}
      </DetailList>

      {info.equipoCategoriaDistinta && info.equipoCategoria && (
        <p className="flex items-start gap-2 rounded-lg bg-surface-2 p-3 text-xs text-muted">
          <Info className="mt-px size-3.5 shrink-0 text-faint" aria-hidden />
          <span>
            {t("enrTrainsPlaysNote", {
              training: info.categoria ?? "—",
              team: info.equipo ?? "—",
              teamCategory: info.equipoCategoria,
            })}
          </span>
        </p>
      )}
      {info.fueraDeCategoria && (
        <p className="flex items-start gap-2 rounded-lg bg-surface-2 p-3 text-xs text-muted">
          <Info className="mt-px size-3.5 shrink-0 text-faint" aria-hidden />
          <span>
            {info.categoriaPorEdad
              ? t("outOfCategoryNote", {
                  current: info.categoria ?? "—",
                  expected: info.categoriaPorEdad,
                })
              : t("noAgeCategoryNote", { current: info.categoria ?? "—" })}
          </span>
        </p>
      )}

      {admin && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {!info.equipoId && (
            <span className="text-xs text-faint">{t("enrManage")}</span>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Pencil className="size-3.5" />
            {t("enrChangeCategory")}
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryForm({
  jugadorId,
  info,
  categories,
  onDone,
}: {
  jugadorId: string;
  info: EnrollmentInfo;
  categories: Category[];
  onDone: () => void;
}) {
  const t = useTranslations("players");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<EnrollmentState, FormData>(
    cambiarCategoriaInscripcion,
    null,
  );
  const [catId, setCatId] = useState(
    info.categoriaId ?? categories[0]?.id ?? "",
  );

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state?.ok, onDone]);

  const isException = !!catId && catId !== info.categoriaPorEdadId;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="jugador_id" value={jugadorId} />
      <FormBanner error={state?.error} />

      <Field
        label={t("colCategory")}
        htmlFor="categoria_id"
        hint={
          info.categoriaPorEdad
            ? t("enrByAgeHint", { category: info.categoriaPorEdad })
            : undefined
        }
      >
        <Select
          id="categoria_id"
          name="categoria_id"
          value={catId}
          onChange={(e) => setCatId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({c.edad_min}–{c.edad_max})
            </option>
          ))}
        </Select>
      </Field>

      {isException && (
        <Field
          label={t("wizExceptionReason")}
          htmlFor="motivo_excepcion"
          hint={t("wizExceptionReasonHint")}
        >
          <Textarea
            id="motivo_excepcion"
            name="motivo_excepcion"
            rows={2}
            defaultValue={info.motivoExcepcion ?? ""}
          />
        </Field>
      )}

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
