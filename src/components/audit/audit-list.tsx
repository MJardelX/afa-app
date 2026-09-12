import { getTranslations } from "next-intl/server";

import { ACTION_KEY, TABLE_KEY } from "@/components/audit/labels";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { AuditEntry } from "@/server/audit";

const ACTION_TONE: Record<string, BadgeTone> = {
  INSERT: "good",
  UPDATE: "warn",
  DELETE: "danger",
};

function fmtValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function Diff({
  before,
  after,
  noChanges,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  noChanges: string;
}) {
  if (before && after) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
    const changed = keys.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
    if (!changed.length) {
      return <p className="text-xs italic text-muted">{noChanges}</p>;
    }
    return (
      <dl className="space-y-1.5 text-xs">
        {changed.map((k) => (
          <div key={k} className="flex flex-wrap items-baseline gap-x-1.5">
            <dt className="font-mono text-faint">{k}:</dt>
            <dd className="text-danger line-through">{fmtValue(before[k])}</dd>
            <dd className="font-medium text-status-good-fg">{fmtValue(after[k])}</dd>
          </div>
        ))}
      </dl>
    );
  }

  const row = after ?? before;
  if (!row) return null;
  const entries = Object.entries(row).filter(([, v]) => v !== null && v !== "");
  return (
    <dl className="space-y-1 text-xs">
      {entries.map(([k, v]) => (
        <div key={k} className="flex flex-wrap gap-1.5">
          <dt className="font-mono text-faint">{k}:</dt>
          <dd className="min-w-0 break-words">{fmtValue(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

export async function AuditList({ rows, locale }: { rows: AuditEntry[]; locale: string }) {
  const t = await getTranslations("audit");
  const fmtDate = (v: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(v));

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">{t("empty")}</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.id} className="py-2.5 first:pt-0 last:pb-0">
          <details className="group">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
              <span className="w-36 shrink-0 text-xs tabular-nums text-faint">
                {fmtDate(r.fecha)}
              </span>
              <Badge tone={ACTION_TONE[r.accion] ?? "neutral"}>
                {t(ACTION_KEY[r.accion] ?? r.accion)}
              </Badge>
              <span className="text-sm font-medium">
                {t.has(TABLE_KEY[r.tabla]) ? t(TABLE_KEY[r.tabla]) : r.tabla}
              </span>
              <span className="text-xs text-muted">
                {r.usuarioNombre ?? t("systemUser")}
              </span>
              {r.registroId && (
                <span className="hidden font-mono text-[0.65rem] text-faint sm:inline">
                  {r.registroId.slice(0, 8)}
                </span>
              )}
              <span className="ml-auto shrink-0 text-xs text-brand-legible group-open:hidden">
                {t("viewDetail")}
              </span>
              <span className="ml-auto hidden shrink-0 text-xs text-muted group-open:inline">
                {t("hideDetail")}
              </span>
            </summary>
            <div className="mt-2 rounded-lg bg-surface-2 p-3">
              <Diff before={r.datosPrevios} after={r.datosNuevos} noChanges={t("noChanges")} />
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
