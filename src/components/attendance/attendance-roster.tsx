"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Clock, ShieldCheck, X, type LucideIcon } from "lucide-react";

import {
  registrarAsistencia,
  type AttendanceState,
} from "@/app/(app)/attendance/actions";
import { AttendanceBadge, attendanceLevel } from "@/components/ui/attendance-badge";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATES: AttendanceState[] = ["presente", "tarde", "justificado", "ausente"];

const STATE_ICON: Record<AttendanceState, LucideIcon> = {
  presente: Check,
  tarde: Clock,
  justificado: ShieldCheck,
  ausente: X,
};

const STATE_ACTIVE_CLASS: Record<AttendanceState, string> = {
  presente: "bg-status-good-bg text-status-good-fg",
  tarde: "bg-status-fair-bg text-status-fair-fg",
  justificado: "bg-brand-subtle text-brand-legible",
  ausente: "bg-status-low-bg text-status-low-fg",
};

const STATE_LABEL_KEY: Record<AttendanceState, string> = {
  presente: "markStatePresente",
  tarde: "markStateTarde",
  justificado: "markStateJustificado",
  ausente: "markStateAusente",
};

export type RosterEntry = {
  jugadorId: string;
  nombre: string;
  codigo: string;
  equipo: string | null;
};

export type ExistingMark = {
  jugadorId: string;
  estado: string;
  minutosJugados: number | null;
  goles: number;
  asistenciasGol: number;
};

type MarkState = {
  estado: AttendanceState | null;
  minutos: string;
  goles: string;
  asistencias: string;
};

function isAttendanceState(v: string): v is AttendanceState {
  return (STATES as string[]).includes(v);
}

export function AttendanceRoster({
  sessionId,
  roster,
  existing,
  isMatch,
}: {
  sessionId: string;
  roster: RosterEntry[];
  existing: ExistingMark[];
  isMatch: boolean;
}) {
  const t = useTranslations("attendance");
  const tc = useTranslations("common");

  const initial = useMemo(() => {
    const byPlayer = new Map(existing.map((m) => [m.jugadorId, m]));
    const out: Record<string, MarkState> = {};
    for (const p of roster) {
      const m = byPlayer.get(p.jugadorId);
      out[p.jugadorId] = {
        estado: m && isAttendanceState(m.estado) ? m.estado : null,
        minutos: m?.minutosJugados != null ? String(m.minutosJugados) : "",
        goles: m?.goles ? String(m.goles) : "",
        asistencias: m?.asistenciasGol ? String(m.asistenciasGol) : "",
      };
    }
    return out;
  }, [roster, existing]);

  const [marks, setMarks] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(jugadorId: string, patch: Partial<MarkState>) {
    setMarks((prev) => ({ ...prev, [jugadorId]: { ...prev[jugadorId], ...patch } }));
    setDirty(true);
    setSaved(false);
  }

  function markAllPresent() {
    setMarks((prev) => {
      const next = { ...prev };
      for (const p of roster) {
        if (!next[p.jugadorId]?.estado) {
          next[p.jugadorId] = { ...next[p.jugadorId], estado: "presente" };
        }
      }
      return next;
    });
    setDirty(true);
    setSaved(false);
  }

  const marked = roster.filter((p) => marks[p.jugadorId]?.estado);
  const present = marked.filter(
    (p) => marks[p.jugadorId]?.estado === "presente" || marks[p.jugadorId]?.estado === "tarde",
  );
  const percent = marked.length ? Math.round((100 * present.length) / marked.length) : 0;

  async function handleSave() {
    setSaving(true);
    setError(null);
    const payload = roster
      .map((p) => {
        const m = marks[p.jugadorId];
        if (!m?.estado) return null;
        return {
          jugadorId: p.jugadorId,
          estado: m.estado,
          minutosJugados: m.minutos ? Number(m.minutos) : null,
          goles: m.goles ? Number(m.goles) : 0,
          asistenciasGol: m.asistencias ? Number(m.asistencias) : 0,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    const res = await registrarAsistencia(sessionId, payload);
    setSaving(false);
    if ("error" in res) {
      setError(res.error);
    } else {
      setDirty(false);
      setSaved(true);
    }
  }

  if (roster.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">{t("rosterEmpty")}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={markAllPresent}
          className="text-xs font-medium text-brand-legible hover:underline"
        >
          {t("markAllPresent")}
        </button>
        {marked.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{t("markedCount", { marked: marked.length, total: roster.length })}</span>
            <AttendanceBadge level={attendanceLevel(percent)} percent={percent} />
          </div>
        )}
      </div>

      {/* Icon legend — the per-row buttons are icon-only, and on touch devices
          there's no hover to reveal the title/aria-label, so spell it out once
          here instead of leaving mobile users guessing. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-2/60 px-2.5 py-1.5 text-[0.7rem] text-muted">
        {STATES.map((s) => {
          const Icon = STATE_ICON[s];
          return (
            <span key={s} className="inline-flex items-center gap-1">
              <Icon className="size-3.5" />
              {t(STATE_LABEL_KEY[s])}
            </span>
          );
        })}
      </div>

      <ul className="divide-y divide-line">
        {roster.map((p) => {
          const mark = marks[p.jugadorId] ?? { estado: null, minutos: "", goles: "", asistencias: "" };
          return (
            <li key={p.jugadorId} className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <Avatar name={p.nombre} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.nombre}</p>
                <p className="text-xs text-faint">
                  {p.codigo}
                  {p.equipo ? ` · ${p.equipo}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {STATES.map((s) => {
                  const Icon = STATE_ICON[s];
                  const active = mark.estado === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      title={t(STATE_LABEL_KEY[s])}
                      aria-label={t(STATE_LABEL_KEY[s])}
                      aria-pressed={active}
                      onClick={() => update(p.jugadorId, { estado: s })}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-lg transition-colors",
                        active ? STATE_ACTIVE_CLASS[s] : "bg-surface-2 text-faint hover:text-muted",
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>

              {isMatch && (
                <div className="flex basis-full items-center gap-2 pl-11 sm:basis-auto sm:pl-0">
                  <label className="flex items-center gap-1 text-xs text-muted">
                    {t("markMinutes")}
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={mark.minutos}
                      onChange={(e) => update(p.jugadorId, { minutos: e.target.value })}
                      className="h-7 w-14 rounded-md border border-line bg-canvas px-1.5 text-center text-xs outline-none focus:border-brand"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted">
                    {t("markGoals")}
                    <input
                      type="number"
                      min={0}
                      value={mark.goles}
                      onChange={(e) => update(p.jugadorId, { goles: e.target.value })}
                      className="h-7 w-12 rounded-md border border-line bg-canvas px-1.5 text-center text-xs outline-none focus:border-brand"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted">
                    {t("markAssists")}
                    <input
                      type="number"
                      min={0}
                      value={mark.asistencias}
                      onChange={(e) => update(p.jugadorId, { asistencias: e.target.value })}
                      className="h-7 w-12 rounded-md border border-line bg-canvas px-1.5 text-center text-xs outline-none focus:border-brand"
                    />
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-line pt-3">
        {saved && !dirty && (
          <span className="text-xs text-status-good-fg">{t("markSaved")}</span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className={buttonClasses("primary", "sm")}
        >
          {saving ? tc("saving") : t("markSave")}
        </button>
      </div>
    </div>
  );
}
