"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { LoaderCircle } from "lucide-react";

import {
  finalizarEvaluacion,
  guardarBorrador,
  reabrirEvaluacion,
} from "@/app/(app)/assessment/actions";
import { buttonClasses } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import type { EvalCriterion } from "@/server/evaluation";
import { cn } from "@/lib/utils";

const DIM_KEY: Record<string, string> = {
  tecnica: "dimTecnica",
  tactica: "dimTactica",
  fisica: "dimFisica",
  actitudinal: "dimActitudinal",
};

export function EvaluationForm({
  jugadorId,
  periodoId,
  criteria,
  initialScores,
  initialComment,
  estado,
}: {
  jugadorId: string;
  periodoId: string;
  criteria: EvalCriterion[];
  initialScores: Record<string, number>;
  initialComment: string | null;
  estado: "borrador" | "finalizada" | null;
}) {
  const t = useTranslations("evaluation");
  const ts = useTranslations("settings");
  const tc = useTranslations("common");

  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [comment, setComment] = useState(initialComment ?? "");
  const [locked, setLocked] = useState(estado === "finalizada");
  const [saving, setSaving] = useState<"draft" | "finalize" | "reopen" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [openRubric, setOpenRubric] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const byDim = new Map<string, EvalCriterion[]>();
    for (const c of criteria) {
      if (!byDim.has(c.dimension)) byDim.set(c.dimension, []);
      byDim.get(c.dimension)!.push(c);
    }
    return [...byDim.entries()];
  }, [criteria]);

  const scoredCount = criteria.filter((c) => scores[c.id] != null).length;

  function setScore(criterioId: string, val: number) {
    if (locked) return;
    setScores((prev) => ({ ...prev, [criterioId]: val }));
    setSaved(false);
  }

  async function handleSave(thenFinalize: boolean) {
    setSaving(thenFinalize ? "finalize" : "draft");
    setError(null);

    const payload = Object.entries(scores).map(([criterioId, puntaje]) => ({
      criterioId,
      puntaje,
    }));
    const res = await guardarBorrador(jugadorId, periodoId, payload, comment || null);
    if (res?.error) {
      setSaving(null);
      setError(res.error);
      return;
    }

    if (thenFinalize) {
      const res2 = await finalizarEvaluacion(jugadorId, periodoId);
      setSaving(null);
      if (res2?.error) {
        setError(res2.error);
        return;
      }
      setLocked(true);
    } else {
      setSaving(null);
    }
    setSaved(true);
  }

  async function handleReopen() {
    setSaving("reopen");
    setError(null);
    const res = await reabrirEvaluacion(jugadorId, periodoId);
    setSaving(null);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setLocked(false);
    setSaved(false);
  }

  return (
    <div className="space-y-5">
      {locked && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-status-good-bg px-3 py-2 text-xs text-status-good-fg">
          <span>{t("finalizedNotice")}</span>
          <button
            type="button"
            onClick={handleReopen}
            disabled={saving === "reopen"}
            className="inline-flex items-center gap-1.5 font-medium underline underline-offset-2 disabled:opacity-60"
          >
            {saving === "reopen" && <LoaderCircle className="size-3.5 animate-spin" />}
            {saving === "reopen" ? tc("saving") : t("reopen")}
          </button>
        </div>
      )}

      {groups.map(([dimension, items]) => (
        <div key={dimension} className="space-y-4 rounded-2xl border border-line bg-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
            {ts.has(DIM_KEY[dimension]) ? ts(DIM_KEY[dimension]) : dimension}
          </h2>
          <div className="space-y-4">
            {items.map((c) => (
              <CriterionScorer
                key={c.id}
                criterion={c}
                value={scores[c.id]}
                locked={locked}
                onChange={(v) => setScore(c.id, v)}
                rubricOpen={!!openRubric[c.id]}
                onToggleRubric={() =>
                  setOpenRubric((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                }
              />
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium" htmlFor="eval-comment">
          {t("comentarioGeneral")}
        </label>
        <Textarea
          id="eval-comment"
          rows={3}
          value={comment}
          disabled={locked}
          onChange={(e) => {
            setComment(e.target.value);
            setSaved(false);
          }}
          placeholder={t("comentarioGeneralPlaceholder")}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-xs text-muted">
          {t("scoredCount", { scored: scoredCount, total: criteria.length })}
        </span>
        <div className="flex items-center gap-3">
          {saved && !saving && (
            <span className="text-xs text-status-good-fg">{t("saved")}</span>
          )}
          {!locked && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={!!saving}
                className={buttonClasses("secondary", "sm")}
              >
                {saving === "draft" && <LoaderCircle className="size-3.5 animate-spin" />}
                {saving === "draft" ? tc("saving") : t("saveDraft")}
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={!!saving}
                className={buttonClasses("primary", "sm")}
              >
                {saving === "finalize" && <LoaderCircle className="size-3.5 animate-spin" />}
                {saving === "finalize" ? tc("saving") : t("saveFinalize")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CriterionScorer({
  criterion,
  value,
  locked,
  onChange,
  rubricOpen,
  onToggleRubric,
}: {
  criterion: EvalCriterion;
  value: number | undefined;
  locked: boolean;
  onChange: (v: number) => void;
  rubricOpen: boolean;
  onToggleRubric: () => void;
}) {
  const t = useTranslations("evaluation");
  const scale = Array.from({ length: criterion.escalaMax }, (_, i) => i + 1);
  const hasRubric = criterion.rubrica && Object.keys(criterion.rubrica).length > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{criterion.nombre}</p>
          {criterion.descripcion && (
            <p className="text-xs text-muted">{criterion.descripcion}</p>
          )}
        </div>
        {hasRubric && (
          <button
            type="button"
            onClick={onToggleRubric}
            className="shrink-0 text-xs text-brand-legible hover:underline"
          >
            {t("rubricToggle")}
          </button>
        )}
      </div>

      {rubricOpen && criterion.rubrica && (
        <dl className="space-y-1 rounded-lg bg-surface-2 p-2.5 text-xs text-muted">
          {Object.entries(criterion.rubrica)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([score, text]) => (
              <div key={score} className="flex gap-2">
                <dt className="shrink-0 font-semibold tabular-nums">{score}</dt>
                <dd>{text}</dd>
              </div>
            ))}
        </dl>
      )}

      <div className="flex flex-wrap gap-1.5">
        {scale.map((n) => (
          <button
            key={n}
            type="button"
            disabled={locked}
            onClick={() => onChange(n)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg text-sm font-medium tabular-nums transition-colors",
              value === n
                ? "bg-brand text-brand-fg"
                : "bg-surface-2 text-muted hover:text-fg",
              locked && "cursor-not-allowed opacity-70",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
