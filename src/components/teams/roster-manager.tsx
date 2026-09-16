"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Plus, Search, X } from "lucide-react";

import {
  actualizarInscripcion,
  buscarJugadoresParaEquipo,
  darDeBaja,
  inscribirJugador,
  type RosterState,
} from "@/app/(app)/teams/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { controlClass, Field, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import type { EnrollCandidate } from "@/server/teams";
import { cn } from "@/lib/utils";

export type RosterEntry = {
  inscripcionId: string;
  jugadorId: string;
  numero: number | null;
  posicion: string | null;
  fechaAltaLabel: string;
  nombres: string;
  apellidos: string;
  codigo: string;
};

export function RosterManager({
  teamId,
  teamCategoryId,
  teamEdadMin,
  roster,
}: {
  teamId: string;
  teamCategoryId: string;
  teamEdadMin: number | null;
  roster: RosterEntry[];
}) {
  const t = useTranslations("teams");
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {roster.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("rosterEmpty")}</p>
      ) : (
        <ul className="divide-y divide-line">
          {roster.map((r) => (
            <RosterRow key={r.inscripcionId} teamId={teamId} entry={r} />
          ))}
        </ul>
      )}

      {adding ? (
        <EnrollBox
          teamId={teamId}
          teamCategoryId={teamCategoryId}
          teamEdadMin={teamEdadMin}
          onDone={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <Plus className="size-3.5" />
          {t("enroll")}
        </button>
      )}
    </div>
  );
}

function RosterRow({
  teamId,
  entry,
}: {
  teamId: string;
  entry: RosterEntry;
}) {
  const t = useTranslations("teams");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const name = `${entry.nombres} ${entry.apellidos}`.trim();

  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <span className="w-7 shrink-0 text-center text-sm font-semibold tabular-nums text-muted">
          {entry.numero ?? "—"}
        </span>
        <Avatar name={name} size="sm" />
        <Link
          href={`/players/${entry.jugadorId}`}
          className="min-w-0 flex-1 truncate text-sm font-medium hover:text-brand-legible"
        >
          {name}
          <span className="ml-2 text-xs font-normal tabular-nums text-faint">
            {entry.codigo}
          </span>
        </Link>
        {entry.posicion && !editing && (
          <span className="shrink-0 text-xs text-muted">{entry.posicion}</span>
        )}
        <span className="hidden shrink-0 text-xs text-faint sm:inline">
          {t("since")} {entry.fechaAltaLabel}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-[0.7rem] text-muted hover:text-brand-legible"
          >
            {tc("edit")}
          </button>
          <form action={darDeBaja}>
            <input type="hidden" name="inscripcion_id" value={entry.inscripcionId} />
            <input type="hidden" name="equipo_id" value={teamId} />
            <ConfirmButton
              question={t("removeConfirm")}
              confirmLabel={t("removeFromTeam")}
              cancelLabel={tc("cancel")}
              className="text-[0.7rem] text-muted hover:text-danger"
            >
              {t("removeFromTeam")}
            </ConfirmButton>
          </form>
        </div>
      </div>

      {editing && (
        <EditEnrollmentForm
          teamId={teamId}
          entry={entry}
          onDone={() => setEditing(false)}
        />
      )}
    </li>
  );
}

function EditEnrollmentForm({
  teamId,
  entry,
  onDone,
}: {
  teamId: string;
  entry: RosterEntry;
  onDone: () => void;
}) {
  const t = useTranslations("teams");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<RosterState, FormData>(
    actualizarInscripcion,
    null,
  );

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state?.ok, onDone]);

  return (
    <form
      action={formAction}
      className="mt-2 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface-2/60 p-3"
    >
      <input type="hidden" name="inscripcion_id" value={entry.inscripcionId} />
      <input type="hidden" name="equipo_id" value={teamId} />
      <Field label={t("shirt")} htmlFor={`shirt-${entry.inscripcionId}`} className="w-24">
        <TextInput
          id={`shirt-${entry.inscripcionId}`}
          name="numero_camiseta"
          inputMode="numeric"
          defaultValue={entry.numero ?? ""}
          invalid={!!state?.fieldErrors?.numero_camiseta}
        />
      </Field>
      <Field
        label={t("position")}
        htmlFor={`pos-${entry.inscripcionId}`}
        className="flex-1 min-w-40"
      >
        <TextInput
          id={`pos-${entry.inscripcionId}`}
          name="posicion"
          defaultValue={entry.posicion ?? ""}
          autoComplete="off"
        />
      </Field>
      <div className="flex gap-2">
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
      {state?.error && (
        <p className="w-full text-xs text-danger">{state.error}</p>
      )}
    </form>
  );
}

function EnrollBox({
  teamId,
  teamCategoryId,
  teamEdadMin,
  onDone,
}: {
  teamId: string;
  teamCategoryId: string;
  teamEdadMin: number | null;
  onDone: () => void;
}) {
  const t = useTranslations("teams");
  const tc = useTranslations("common");

  const [state, formAction] = useActionState<RosterState, FormData>(
    inscribirJugador,
    null,
  );
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<EnrollCandidate[]>([]);
  const [picked, setPicked] = useState<EnrollCandidate | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const errs = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state?.ok, onDone]);

  function onSearch(v: string) {
    setTerm(v);
    setPicked(null);
    clearTimeout(timer.current);
    if (v.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      startTransition(async () => {
        setResults(await buscarJugadoresParaEquipo(teamId, v.trim()));
      });
    }, 300);
  }

  const outOfCategory =
    picked != null && picked.categoriaPorEdadId !== teamCategoryId;
  // The team is a younger bracket than the player's real (by-age) category —
  // the app only allows moving up, never down (tg_inscripcion_equipo_categoria
  // enforces this at the DB level too, so this is a pre-submit UX guard).
  const belowAge =
    outOfCategory &&
    picked!.categoriaPorEdadEdadMin != null &&
    teamEdadMin != null &&
    teamEdadMin < picked!.categoriaPorEdadEdadMin;

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-3"
    >
      <input type="hidden" name="equipo_id" value={teamId} />
      <input type="hidden" name="jugador_id" value={picked?.id ?? ""} />
      <FormBanner error={state?.error} />

      {picked ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-status-good-bg px-2.5 py-1.5 text-xs text-status-good-fg">
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5" strokeWidth={2.5} />
              {picked.nombre}
              <span className="opacity-70">{picked.codigo}</span>
            </span>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="hover:opacity-70"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {picked.currentTeam && (
            <p className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-fg">
              {t("transferConfirm", { team: picked.currentTeam })}
            </p>
          )}
          {belowAge ? (
            <p className="rounded-lg bg-danger-bg px-2.5 py-1.5 text-xs font-medium text-danger">
              {t("teamBelowAgeWarning", { category: picked.categoriaPorEdad ?? "—" })}
            </p>
          ) : (
            outOfCategory && (
              <p className="text-xs text-muted">
                {t("belongsIn", { category: picked.categoriaPorEdad ?? "—" })}
              </p>
            )
          )}
        </div>
      ) : (
        <div className="relative">
          <Search
            aria-hidden
            strokeWidth={1.6}
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={term}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("enrollPlaceholder")}
            className={cn(controlClass, "pl-9")}
            aria-invalid={!!errs.jugador_id}
          />
        </div>
      )}

      {!picked && term.trim().length >= 2 && (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-line bg-canvas text-sm">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted">
              {pending ? tc("loading") : t("enrollNoMatches")}
            </li>
          ) : (
            results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPicked(r);
                    setResults([]);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-surface-2"
                >
                  <span className="truncate">
                    {r.nombre}
                    <span className="ml-1.5 text-xs text-faint">{r.codigo}</span>
                  </span>
                  {r.currentTeam ? (
                    <Badge tone="neutral">{r.currentTeam}</Badge>
                  ) : (
                    <span className="shrink-0 text-xs text-muted">
                      {r.categoriaPorEdad ?? ""}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {picked && (
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("shirt")} htmlFor="enroll-shirt" className="w-24">
            <TextInput
              id="enroll-shirt"
              name="numero_camiseta"
              inputMode="numeric"
              invalid={!!errs.numero_camiseta}
            />
          </Field>
          <Field
            label={t("position")}
            htmlFor="enroll-pos"
            className="flex-1 min-w-40"
          >
            <TextInput id="enroll-pos" name="posicion" autoComplete="off" />
          </Field>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className={buttonClasses("ghost", "sm")}
        >
          {tc("cancel")}
        </button>
        <SubmitButton size="sm" pendingLabel={tc("saving")} disabled={belowAge}>
          {picked?.currentTeam ? t("transferBtn") : t("enroll")}
        </SubmitButton>
      </div>
    </form>
  );
}
