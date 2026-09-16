"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Plus, Search, Star, Unlink, X } from "lucide-react";

import {
  buscarTutores,
  desvincularTutor,
  hacerContactoPrincipal,
  vincularTutor,
  type GuardianState,
} from "@/app/(app)/players/guardian-actions";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Checkbox, Field, Select, TextInput, controlClass } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { IconAction, iconActionClasses } from "@/components/ui/icon-action";
import { ListPagination, usePagedList } from "@/components/ui/list-pagination";
import { SubmitButton } from "@/components/ui/submit-button";
import { RELATIONSHIPS } from "@/lib/schemas/tutor";
import { cn } from "@/lib/utils";

function relKey(r: string) {
  return `rel${r[0].toUpperCase()}${r.slice(1)}` as
    | "relPadre"
    | "relMadre"
    | "relEncargado"
    | "relOtro";
}

type Guardian = {
  tutor_id: string;
  parentesco: string;
  es_contacto_principal: boolean;
  autoriza_retiro: boolean;
  tutores: {
    id: string;
    nombres: string;
    apellidos: string;
    telefono: string | null;
  } | null;
};

export function GuardiansSection({
  jugadorId,
  guardians,
  admin,
}: {
  jugadorId: string;
  guardians: Guardian[];
  admin: boolean;
}) {
  const t = useTranslations("players");
  const tc = useTranslations("common");
  const [adding, setAdding] = useState(false);
  const { page, setPage, pageCount, pageItems } = usePagedList(guardians);

  return (
    <div className="space-y-3">
      {guardians.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">{t("tutEmpty")}</p>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {pageItems.map((g) => {
              const tut = g.tutores;
              return (
                <li key={g.tutor_id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/players/tutors/${g.tutor_id}`}
                      className="text-sm font-medium hover:text-brand-legible"
                    >
                      {tut ? `${tut.nombres} ${tut.apellidos}` : "—"}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">{tut?.telefono ?? "—"}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone={g.es_contacto_principal ? "brand" : "neutral"}>
                        {t(relKey(g.parentesco))}
                      </Badge>
                      {g.es_contacto_principal && (
                        <span className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-brand-legible">
                          <Star className="size-3 fill-current" />
                          {t("tutPrimary")}
                        </span>
                      )}
                      {g.autoriza_retiro && (
                        <span className="text-[0.65rem] text-muted">
                          {t("tutAllowsPickup")}
                        </span>
                      )}
                    </div>
                  </div>

                  {admin && (
                    <div className="flex shrink-0 items-center gap-1">
                      {!g.es_contacto_principal && (
                        <form action={hacerContactoPrincipal}>
                          <input type="hidden" name="jugador_id" value={jugadorId} />
                          <input type="hidden" name="tutor_id" value={g.tutor_id} />
                          <IconAction type="submit" label={t("tutSetPrimary")} tone="brand">
                            <Star className="size-4" />
                          </IconAction>
                        </form>
                      )}
                      <form action={desvincularTutor}>
                        <input type="hidden" name="jugador_id" value={jugadorId} />
                        <input type="hidden" name="tutor_id" value={g.tutor_id} />
                        <ConfirmButton
                          question={t("tutRemoveConfirm")}
                          confirmLabel={t("tutRemove")}
                          cancelLabel={tc("cancel")}
                          label={t("tutRemove")}
                          className={iconActionClasses("danger")}
                        >
                          <Unlink className="size-4" />
                        </ConfirmButton>
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <ListPagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}

      {admin &&
        (adding ? (
          <AddGuardianForm
            jugadorId={jugadorId}
            onDone={() => setAdding(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Plus className="size-3.5" />
            {t("tutAdd")}
          </button>
        ))}
    </div>
  );
}

function AddGuardianForm({
  jugadorId,
  onDone,
}: {
  jugadorId: string;
  onDone: () => void;
}) {
  const t = useTranslations("players");
  const tc = useTranslations("common");

  const [state, formAction] = useActionState<GuardianState, FormData>(
    vincularTutor,
    null,
  );
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<
    { id: string; nombres: string; apellidos: string; telefono: string | null }[]
  >([]);
  const [picked, setPicked] = useState<{
    id: string;
    nombres: string;
    apellidos: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const errs = state?.fieldErrors ?? {};

  // Collapse the form once the link succeeds (the server re-rendered the list).
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
        setResults(await buscarTutores(jugadorId, v.trim()));
      });
    }, 300);
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-3"
    >
      <input type="hidden" name="jugador_id" value={jugadorId} />
      <input type="hidden" name="mode" value={mode} />
      <FormBanner error={state?.error} />

      <div className="inline-flex rounded-lg bg-canvas p-0.5 text-xs ring-1 ring-inset ring-line">
        {(["existing", "new"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium transition-colors",
              mode === m
                ? "bg-brand text-brand-fg"
                : "text-muted hover:text-fg",
            )}
          >
            {m === "existing" ? t("tutPickExisting") : t("tutCreateNew")}
          </button>
        ))}
      </div>

      {mode === "existing" ? (
        <div className="space-y-2">
          <input type="hidden" name="tutor_id" value={picked?.id ?? ""} />
          {picked ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-status-good-bg px-2.5 py-1.5 text-xs text-status-good-fg">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5" strokeWidth={2.5} />
                {picked.nombres} {picked.apellidos}
              </span>
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="hover:opacity-70"
              >
                <X className="size-3.5" />
              </button>
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
                placeholder={t("tutSearchPlaceholder")}
                className={cn(controlClass, "pl-9")}
                aria-invalid={!!errs.tutor_id}
              />
            </div>
          )}

          {!picked && term.trim().length >= 2 && (
            <ul className="max-h-40 overflow-y-auto rounded-lg border border-line bg-canvas text-sm">
              {results.length === 0 ? (
                <li className="px-3 py-2 text-xs text-muted">
                  {pending ? tc("loading") : t("tutSearchNoResults")}
                </li>
              ) : (
                results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setPicked({
                          id: r.id,
                          nombres: r.nombres,
                          apellidos: r.apellidos,
                        })
                      }
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-surface-2"
                    >
                      <span className="truncate">
                        {r.nombres} {r.apellidos}
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {r.telefono ?? ""}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("gFirstName")} htmlFor="ag_nombres" error={errs.nombres}>
            <TextInput id="ag_nombres" name="nombres" autoComplete="off" invalid={!!errs.nombres} />
          </Field>
          <Field label={t("gLastName")} htmlFor="ag_apellidos" error={errs.apellidos}>
            <TextInput id="ag_apellidos" name="apellidos" autoComplete="off" invalid={!!errs.apellidos} />
          </Field>
          <Field
            label={t("tutDpi")}
            htmlFor="ag_dpi"
            error={errs.dpi}
            hint={tc("optional")}
          >
            <TextInput id="ag_dpi" name="dpi" inputMode="numeric" invalid={!!errs.dpi} />
          </Field>
          <Field label={t("tutPhone")} htmlFor="ag_telefono">
            <TextInput id="ag_telefono" name="telefono" type="tel" inputMode="tel" />
          </Field>
          <Field label={t("tutEmail")} htmlFor="ag_email" className="sm:col-span-2">
            <TextInput id="ag_email" name="email" type="email" autoComplete="off" />
          </Field>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("tutRelationship")} htmlFor="ag_parentesco">
          <Select id="ag_parentesco" name="parentesco" defaultValue="encargado">
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {t(relKey(r))}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end pb-2">
          <Checkbox
            name="autoriza_retiro"
            defaultChecked
            label={t("tutAllowsPickup")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className={buttonClasses("ghost", "sm")}
        >
          {tc("cancel")}
        </button>
        <SubmitButton size="sm" pendingLabel={tc("saving")}>
          {mode === "existing" ? t("tutLinkBtn") : t("tutCreateLinkBtn")}
        </SubmitButton>
      </div>
    </form>
  );
}
