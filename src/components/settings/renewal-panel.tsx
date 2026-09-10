"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import {
  cargarVistaPrevia,
  ejecutarRenovacion,
  type RenewalResult,
} from "@/app/(app)/settings/renewal-actions";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Field, Select } from "@/components/ui/field";
import type { RenewalPreviewRow } from "@/server/renewal";

type SeasonOption = { id: string; nombre: string };

export function RenewalPanel({
  seasons,
  activeSeasonName,
}: {
  seasons: SeasonOption[];
  activeSeasonName: string | null;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  const [destinoId, setDestinoId] = useState("");
  const [rows, setRows] = useState<RenewalPreviewRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [activar, setActivar] = useState(true);

  const [state, formAction] = useActionState<RenewalResult | null, FormData>(
    async () => ejecutarRenovacion(destinoId, activar),
    null,
  );

  async function loadPreview(id: string) {
    setDestinoId(id);
    setPreviewError(null);
    setRows(null);
    if (!id) return;
    setLoading(true);
    const res = await cargarVistaPrevia(id);
    setLoading(false);
    if ("error" in res) {
      setPreviewError(res.error);
      return;
    }
    setRows(res.rows);
  }

  if (state && "ok" in state) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-status-good-bg px-3 py-2 text-sm text-status-good-fg">
          {t("renewalDone", { renovados: state.renovados, egresados: state.egresados })}
        </p>
        {state.omitidos > 0 && (
          <p className="text-xs text-muted">{t("renewalSkipped", { count: state.omitidos })}</p>
        )}
      </div>
    );
  }

  const promoted = rows?.filter((r) => !r.egresa) ?? [];
  const graduated = rows?.filter((r) => r.egresa) ?? [];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        {activeSeasonName
          ? t("renewalFrom", { season: activeSeasonName })
          : t("renewalNoActive")}
      </p>

      <Field label={t("renewalDestino")} htmlFor="renewal-destino">
        <Select
          id="renewal-destino"
          value={destinoId}
          onChange={(e) => loadPreview(e.target.value)}
        >
          <option value="">{tc("choose")}</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </Select>
      </Field>

      {loading && <p className="text-sm text-muted">{tc("loading")}</p>}
      {previewError && <p className="text-sm text-danger">{previewError}</p>}
      {state && "error" in state && <p className="text-sm text-danger">{state.error}</p>}

      {rows &&
        (rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">{t("renewalEmpty")}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{t("renewalPromotedCount", { count: promoted.length })}</Badge>
              {graduated.length > 0 && (
                <Badge tone="warn">{t("renewalGraduatedCount", { count: graduated.length })}</Badge>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto rounded-lg border border-line">
              <ul className="divide-y divide-line">
                {rows.map((r) => (
                  <li
                    key={r.jugadorId}
                    className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{r.nombre}</span>
                    <span className="text-xs text-faint">{r.codigo}</span>
                    {r.egresa ? (
                      <Badge tone="warn">{t("renewalGraduates")}</Badge>
                    ) : (
                      <span className="text-xs text-muted">
                        {r.categoriaAnterior ?? "—"}{" "}
                        <span className="font-medium text-fg">→ {r.categoriaSugerida ?? "—"}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
              <input
                type="checkbox"
                checked={activar}
                onChange={(e) => setActivar(e.target.checked)}
                className="size-4 rounded border-line text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
              />
              {t("renewalActivate")}
            </label>

            <form action={formAction}>
              <ConfirmButton
                question={t("renewalConfirmQuestion", { count: rows.length })}
                confirmLabel={t("renewalConfirm")}
                cancelLabel={tc("cancel")}
                tone="brand"
                className={buttonClasses("primary", "md")}
              >
                {t("renewalConfirm")}
              </ConfirmButton>
            </form>
          </div>
        ))}
    </div>
  );
}
