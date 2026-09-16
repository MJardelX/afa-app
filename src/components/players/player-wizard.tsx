"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Calendar, Check, IdCard, User } from "lucide-react";

import {
  crearJugadorCompleto,
  type PlayerFormState,
} from "@/app/(app)/players/actions";
import { GuardianFields } from "@/components/players/guardian-fields";
import { buttonClasses } from "@/components/ui/button";
import { Field, Select, Textarea, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { sportingAge } from "@/lib/format";
import { playerSchema } from "@/lib/schemas/player";
import { guardianSchema } from "@/lib/schemas/tutor";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  nombre: string;
  edad_min: number;
  edad_max: number;
  color: string | null;
};

type TeamGroup = {
  categoriaId: string;
  categoria: string;
  color: string;
  teams: {
    id: string;
    nombre: string;
    activo: boolean;
    coachName: string | null;
    playerCount: number;
  }[];
};

const today = () => new Date().toISOString().slice(0, 10);
const STEP_COUNT = 5;

/** The single system gradient (§2.2) — only ever on stepper nodes / bars. */
const GRAD_ACTIVE = "linear-gradient(145deg, #1F7CA8 0%, #0E4A64 100%)";
const GRAD_DONE = "linear-gradient(145deg, #2286B4 0%, #145F7E 100%)";
const GRAD_CONNECTOR = "linear-gradient(90deg, #145F7E 0%, #1F7CA8 100%)";

/** Which wizard step a given server-side field error belongs to. */
const FIELD_STEP: Record<string, number> = {
  nombres: 1,
  apellidos: 1,
  fecha_nacimiento: 1,
  lugar_nacimiento: 1,
  direccion: 1,
  fecha_ingreso: 1,
  observaciones: 1,
  g_dpi: 2,
  g_nombres: 2,
  g_apellidos: 2,
  g_parentesco: 2,
  g_telefono: 2,
  g_email: 2,
  categoria_final_id: 4,
  motivo_excepcion: 4,
  equipo_id: 5,
  numero_camiseta: 5,
  posicion: 5,
};

export function PlayerWizard({
  categories,
  seasonYear,
  teamGroups,
}: {
  categories: Category[];
  seasonYear: number;
  teamGroups: TeamGroup[];
}) {
  const t = useTranslations("players");
  const tc = useTranslations("common");
  const tf = useTranslations("forms");

  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState<PlayerFormState, FormData>(
    crearJugadorCompleto,
    null,
  );

  const [step, setStep] = useState(1);
  const [visited, setVisited] = useState(1); // furthest step reached
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  // When a failed submit returns, jump once to the first step with an error.
  const [handledErrorState, setHandledErrorState] =
    useState<PlayerFormState>(null);

  // Cross-step state (needed for previews + the summary).
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [birth, setBirth] = useState("");

  // Step 4
  const [catMode, setCatMode] = useState<"age" | "other">("age");
  const [otherCatId, setOtherCatId] = useState(categories[0]?.id ?? "");
  const [motivo, setMotivo] = useState("");

  // Step 5
  const [teamId, setTeamId] = useState("");
  const [camiseta, setCamiseta] = useState("");
  const [posicion, setPosicion] = useState("");

  const serverErrors = state?.fieldErrors ?? {};
  const errs = { ...serverErrors, ...clientErrors };
  const errorSteps = new Set(
    Object.keys(errs)
      .map((k) => FIELD_STEP[k])
      .filter((n): n is number => Boolean(n)),
  );

  const ageAndCat = useMemo(() => {
    if (!birth || Number.isNaN(Date.parse(birth))) return null;
    const age = sportingAge(birth, seasonYear);
    const cat =
      categories.find((c) => age >= c.edad_min && age <= c.edad_max) ?? null;
    return { age, cat };
  }, [birth, seasonYear, categories]);

  const ageCat = ageAndCat?.cat ?? null;
  const noAgeCat = !!ageAndCat && !ageCat;
  const effectiveMode: "age" | "other" = noAgeCat ? "other" : catMode;

  const finalCatId =
    effectiveMode === "age" ? (ageCat?.id ?? "") : otherCatId;
  const finalCat = categories.find((c) => c.id === finalCatId) ?? null;
  const isException = !!finalCatId && finalCatId !== ageCat?.id;

  const teamsInCat =
    teamGroups.find((g) => g.categoriaId === finalCatId)?.teams ?? [];
  const effectiveTeamId = teamsInCat.some((tm) => tm.id === teamId) ? teamId : "";
  const chosenTeam = teamsInCat.find((tm) => tm.id === effectiveTeamId) ?? null;

  const fullNameText = `${nombres} ${apellidos}`.trim();

  // ── navigation ──────────────────────────────────────────────────────────
  function fd() {
    return new FormData(formRef.current!);
  }

  function validateStep(n: number): Record<string, string> {
    const out: Record<string, string> = {};
    if (n === 1) {
      const r = playerSchema.safeParse(Object.fromEntries(fd()));
      if (!r.success) {
        for (const i of r.error.issues) {
          const k = String(i.path[0] ?? "");
          if (FIELD_STEP[k] === 1 && !out[k]) {
            out[k] = tf.has(i.message) ? tf(i.message) : tf("required");
          }
        }
      }
    }
    if (n === 2) {
      const data = Object.fromEntries(fd());
      const r = guardianSchema.safeParse(data);
      if (!r.success) {
        for (const i of r.error.issues) {
          const k = String(i.path[0] ?? "");
          if (!out[k]) out[k] = tf.has(i.message) ? tf(i.message) : tf("required");
        }
      } else if (!r.data.g_tutor_id) {
        // Guardian is optional: blank dpi/nombres/apellidos just skips it.
        // Starting to fill in any one of them requires the trio together.
        if (r.data.g_dpi || r.data.g_nombres || r.data.g_apellidos) {
          if (!r.data.g_dpi) out.g_dpi = tf("required");
          if (!r.data.g_nombres) out.g_nombres = tf("required");
          if (!r.data.g_apellidos) out.g_apellidos = tf("required");
        }
      }
    }
    if (n === 4) {
      if (!finalCatId) out.categoria_final_id = tf("required");
      if (isException && !motivo.trim()) out.motivo_excepcion = tf("required");
    }
    return out;
  }

  function goNext() {
    const e = validateStep(step);
    if (Object.keys(e).length) {
      setClientErrors(e);
      return;
    }
    setClientErrors({});
    const next = Math.min(step + 1, STEP_COUNT);
    setStep(next);
    setVisited((v) => Math.max(v, next));
  }

  function goTo(n: number) {
    if (n >= 1 && n <= visited) {
      setClientErrors({});
      setStep(n);
    }
  }

  function onSubmitAttempt(e: React.FormEvent) {
    // Last-chance client check so the user isn't bounced by the server.
    const all = { ...validateStep(1), ...validateStep(2), ...validateStep(4) };
    if (Object.keys(all).length) {
      e.preventDefault();
      setClientErrors(all);
      const first = Object.keys(all)
        .map((k) => FIELD_STEP[k] ?? 99)
        .sort((a, b) => a - b)[0];
      setStep(first);
    }
  }

  // React's "adjust state during render" pattern: on a new failed-submit
  // result, move to the first step that carries an error (no effect needed).
  if (state !== handledErrorState && state?.fieldErrors) {
    setHandledErrorState(state);
    const s = Object.keys(state.fieldErrors)
      .map((k) => FIELD_STEP[k] ?? 99)
      .sort((a, b) => a - b)[0];
    if (s && s < 99 && s !== step) setStep(s);
  }

  const shownStep = step;

  const STEPS = [
    { name: t("wizStep1"), sub: t("wizStep1Sub") },
    { name: t("wizStep2"), sub: t("wizStep2Sub") },
    { name: t("wizStep3"), sub: t("wizStep3Sub") },
    { name: t("wizStep4"), sub: t("wizStep4Sub") },
    { name: t("wizStep5"), sub: t("wizStep5Sub") },
  ];

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmitAttempt}
      className="space-y-4"
    >
      <Stepper
        current={shownStep}
        visited={visited}
        steps={STEPS}
        errorSteps={errorSteps}
        onGo={goTo}
      />

      <FormBanner error={state?.error} />

      {/* Body — the one flat, solid surface. Neither the stepper above nor the
          action bar below float over it, so no extra clearance padding is
          needed at the bottom. */}
      <div className="rounded-2xl border border-line bg-surface px-5 py-5 sm:px-6 sm:py-6">
        {/* STEP 1 — player -------------------------------------------------- */}
        <Panel hidden={shownStep !== 1} title={t("wizStep1")} hint={t("wizStep1Hint")}>
          <div className="grid gap-x-5 gap-y-[22px] sm:grid-cols-2">
            <Field label={t("fFirstName")} htmlFor="nombres" required error={errs.nombres}>
              <TextInput
                id="nombres"
                name="nombres"
                icon={<User strokeWidth={1.6} />}
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                invalid={!!errs.nombres}
                autoComplete="off"
                autoFocus
              />
            </Field>
            <Field label={t("fLastName")} htmlFor="apellidos" required error={errs.apellidos}>
              <TextInput
                id="apellidos"
                name="apellidos"
                icon={<User strokeWidth={1.6} />}
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                invalid={!!errs.apellidos}
                autoComplete="off"
              />
            </Field>
            <Field
              label={t("fBirthDate")}
              htmlFor="fecha_nacimiento"
              required
              error={errs.fecha_nacimiento}
              hint={
                ageAndCat
                  ? ageCat
                    ? `${t("previewSportingAge", { age: ageAndCat.age })} · ${t("previewBelongs", { category: ageCat.nombre })}`
                    : `${t("previewSportingAge", { age: ageAndCat.age })} · ${t("previewNoCategory")}`
                  : undefined
              }
            >
              <TextInput
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                type="date"
                icon={<Calendar strokeWidth={1.6} />}
                value={birth}
                onChange={(e) => setBirth(e.target.value)}
                invalid={!!errs.fecha_nacimiento}
                max={today()}
              />
            </Field>
            <Field
              label={t("fJoinDate")}
              htmlFor="fecha_ingreso"
              optional
              error={errs.fecha_ingreso}
            >
              <TextInput
                id="fecha_ingreso"
                name="fecha_ingreso"
                type="date"
                icon={<Calendar strokeWidth={1.6} />}
                max={today()}
              />
            </Field>
            <Field label={t("fBirthPlace")} htmlFor="lugar_nacimiento" optional>
              <TextInput id="lugar_nacimiento" name="lugar_nacimiento" />
            </Field>
            <Field
              label={t("fAddress")}
              htmlFor="direccion"
              optional
              className="sm:col-span-2"
            >
              <TextInput id="direccion" name="direccion" />
            </Field>
          </div>

          <Field label={t("fObservations")} htmlFor="observaciones" optional>
            <Textarea id="observaciones" name="observaciones" rows={3} />
          </Field>
        </Panel>

        {/* STEP 2 — guardian --------------------------------------------------- */}
        <Panel hidden={shownStep !== 2} title={t("wizStep2")} hint={t("wizStep2Hint")}>
          <GuardianFields errors={errs} />
        </Panel>

        {/* STEP 3 — medical ------------------------------------------------- */}
        <Panel hidden={shownStep !== 3} title={t("wizStep3")} hint={t("wizStep3Hint")}>
          <div className="space-y-[22px]">
            <Field label={t("medAllergies")} htmlFor="med_alergias" optional>
              <Textarea id="med_alergias" name="med_alergias" rows={2} />
            </Field>
            <Field label={t("medDiseases")} htmlFor="med_enfermedades" optional>
              <Textarea id="med_enfermedades" name="med_enfermedades" rows={2} />
            </Field>
            <Field label={t("medMedications")} htmlFor="med_medicamentos" optional>
              <Textarea id="med_medicamentos" name="med_medicamentos" rows={2} />
            </Field>
            <Field label={t("medNotes")} htmlFor="med_observaciones" optional>
              <Textarea id="med_observaciones" name="med_observaciones" rows={2} />
            </Field>
          </div>
          <p className="text-xs text-muted">{t("wizMedicalSkip")}</p>
        </Panel>

        {/* STEP 4 — category --------------------------------------------------- */}
        <Panel hidden={shownStep !== 4} title={t("wizStep4")} hint={t("wizStep4Hint")}>
          {!ageAndCat ? (
            <p className="text-sm text-muted">{t("wizNeedBirthDate")}</p>
          ) : (
            <>
              <div className="rounded-xl border border-line bg-surface-2/60 p-4 text-sm">
                <p className="text-muted">
                  {t("wizAgeLine", { age: ageAndCat.age, year: seasonYear })}
                </p>
                {ageCat ? (
                  <p className="mt-1 flex items-center gap-2 text-base font-semibold">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full"
                      style={{ background: ageCat.color ?? "#0ea5e9" }}
                    />
                    {ageCat.nombre}
                  </p>
                ) : (
                  <p className="mt-1 font-medium text-warning">{t("wizNoAgeCategory")}</p>
                )}
              </div>

              <fieldset className="space-y-2.5">
                {ageCat && (
                  <ChoiceRow
                    name="cat_mode"
                    value="age"
                    checked={effectiveMode === "age"}
                    onChange={() => setCatMode("age")}
                    title={t("wizStaysIn", { category: ageCat.nombre })}
                    desc={t("wizStaysInHint")}
                  />
                )}
                <ChoiceRow
                  name="cat_mode"
                  value="other"
                  checked={effectiveMode === "other"}
                  onChange={() => setCatMode("other")}
                  title={t("wizMoveCategory")}
                  desc={t("wizMoveCategoryHint")}
                />
              </fieldset>

              {effectiveMode === "other" && (
                <div className="space-y-4 rounded-xl border border-line bg-surface-2/40 p-4">
                  <Field
                    label={t("wizPickCategory")}
                    htmlFor="cat_other"
                    error={errs.categoria_final_id}
                  >
                    <Select
                      id="cat_other"
                      value={otherCatId}
                      onChange={(e) => setOtherCatId(e.target.value)}
                      invalid={!!errs.categoria_final_id}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.edad_min}–{c.edad_max})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label={t("wizExceptionReason")}
                    htmlFor="motivo_excepcion"
                    required
                    error={errs.motivo_excepcion}
                    hint={t("wizExceptionReasonHint")}
                  >
                    <Textarea
                      id="motivo_excepcion"
                      name="motivo_excepcion"
                      rows={2}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      invalid={!!errs.motivo_excepcion}
                    />
                  </Field>
                </div>
              )}

              <input type="hidden" name="categoria_final_id" value={finalCatId} />
              <input type="hidden" name="es_excepcion" value={isException ? "on" : ""} />
            </>
          )}
        </Panel>

        {/* STEP 5 — team + review ---------------------------------------------- */}
        <Panel hidden={shownStep !== 5} title={t("wizStep5")} hint={t("wizStep5Hint")}>
          {finalCat && (
            <p className="text-sm text-muted">
              {t("wizTeamInCategory", { category: finalCat.nombre })}
            </p>
          )}

          {teamsInCat.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              {t("wizNoTeams", { category: finalCat?.nombre ?? "" })}
            </p>
          ) : (
            <fieldset className="space-y-2.5">
              {teamsInCat.map((tm) => (
                <ChoiceRow
                  key={tm.id}
                  name="team_pick"
                  value={tm.id}
                  checked={effectiveTeamId === tm.id}
                  onChange={() => setTeamId(tm.id)}
                  title={tm.nombre}
                  desc={
                    [
                      tm.coachName,
                      t("wizTeamCount", { count: tm.playerCount }),
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  }
                />
              ))}
              <ChoiceRow
                name="team_pick"
                value=""
                checked={effectiveTeamId === ""}
                onChange={() => setTeamId("")}
                title={t("wizNoTeamYet")}
                desc={t("wizNoTeamYetHint")}
              />
            </fieldset>
          )}

          {chosenTeam && (
            <div className="grid gap-x-5 gap-y-[22px] sm:grid-cols-2">
              <Field label={t("fShirtNumber")} htmlFor="numero_camiseta" optional error={errs.numero_camiseta}>
                <TextInput
                  id="numero_camiseta"
                  name="numero_camiseta"
                  inputMode="numeric"
                  value={camiseta}
                  onChange={(e) => setCamiseta(e.target.value)}
                  invalid={!!errs.numero_camiseta}
                />
              </Field>
              <Field label={t("fPosition")} htmlFor="posicion" optional>
                <TextInput
                  id="posicion"
                  name="posicion"
                  icon={<IdCard strokeWidth={1.6} />}
                  value={posicion}
                  onChange={(e) => setPosicion(e.target.value)}
                />
              </Field>
            </div>
          )}

          <input type="hidden" name="equipo_id" value={effectiveTeamId} />

          {/* Review */}
          <div className="rounded-xl border border-line bg-surface-2/60 p-4">
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-faint">
              {t("wizReview")}
            </p>
            <dl className="divide-y divide-line text-sm">
              <ReviewRow term={t("wizReviewName")} value={fullNameText || "—"} />
              <ReviewRow
                term={t("wizReviewCategory")}
                value={
                  finalCat
                    ? isException
                      ? `${finalCat.nombre} · ${t("flagOffCategory")}`
                      : finalCat.nombre
                    : "—"
                }
              />
              <ReviewRow
                term={t("wizReviewTeam")}
                value={chosenTeam ? chosenTeam.nombre : t("wizNoTeamYet")}
              />
            </dl>
          </div>
        </Panel>
      </div>

      {/* Action bar (§8.2) — Cancel far left; Back + Continue travel together
          on the right. Back always renders (disabled on step 1) so the row
          never jumps. Sits right after the form, in normal flow — it no
          longer floats over the content. */}
      <div className="wizard-actions flex items-center gap-2.5 rounded-2xl px-3 py-3 sm:px-4">
        <Link href="/players" className={buttonClasses("ghost", "md")}>
          {tc("cancel")}
        </Link>

        <div className="flex-1" />

        {shownStep === 3 && (
          <button
            type="button"
            onClick={() => {
              setStep(4);
              setVisited((v) => Math.max(v, 4));
            }}
            className={buttonClasses("ghost", "md")}
          >
            {t("wizSkip")}
          </button>
        )}

        <button
          type="button"
          onClick={() => goTo(shownStep - 1)}
          disabled={shownStep === 1}
          className={buttonClasses("secondary", "md")}
        >
          {t("wizBack")}
        </button>

        {shownStep < STEP_COUNT ? (
          <button
            type="button"
            onClick={goNext}
            className={buttonClasses("primary", "md")}
          >
            {t("wizNext")}
            <ArrowRight className="size-4" strokeWidth={1.9} />
          </button>
        ) : (
          <SubmitButton pendingLabel={tc("saving")}>{t("wizCreate")}</SubmitButton>
        )}
      </div>
    </form>
  );
}

// ── pieces ────────────────────────────────────────────────────────────────

type StepMeta = { name: string; sub: string };
type StepStatus = "pending" | "current" | "done" | "error";

function Stepper({
  current,
  visited,
  steps,
  errorSteps,
  onGo,
}: {
  current: number;
  visited: number;
  steps: StepMeta[];
  errorSteps: Set<number>;
  onGo: (n: number) => void;
}) {
  const t = useTranslations("players");
  const total = steps.length;

  const statusOf = (n: number): StepStatus => {
    if (errorSteps.has(n)) return "error";
    if (n === current) return "current";
    // Every step already left behind counts as done — the connector before the
    // next step only fills once its predecessor is done (§5.1).
    return n <= visited ? "done" : "pending";
  };

  const stateWord = (s: StepStatus) =>
    s === "current"
      ? t("wizStateCurrent")
      : s === "done"
        ? t("wizStateDone")
        : s === "error"
          ? t("wizStateError")
          : t("wizStatePending");

  const cur = steps[current - 1];

  return (
    <div className="wizard-rail rounded-2xl px-4 py-3.5 sm:px-6 sm:py-4">
      {/* Mobile (§5.2) — one node + a five-segment bar. */}
      <div className="sm:hidden">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-[0_0_0_4px_rgba(20,95,126,0.13)]"
            style={{ background: GRAD_ACTIVE }}
          >
            {current}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-brand-legible">
              {cur.name}
            </p>
            <p className="truncate text-[0.7rem] font-medium text-brand">
              {cur.sub}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-muted">
            {t("wizStepOf", { n: current, total })}
          </span>
        </div>
        <ol className="mt-3 flex gap-1" aria-hidden>
          {steps.map((s, i) => (
            <li
              key={s.name}
              className="h-[5px] flex-1 rounded-full"
              style={{
                background:
                  i + 1 <= current
                    ? "linear-gradient(90deg,#1F7CA8 0%,#0E4A64 100%)"
                    : "var(--stepper-track)",
              }}
            />
          ))}
        </ol>
      </div>

      {/* Desktop (§5.1) — five equal columns, connector fills between them. */}
      <ol className="hidden pt-1.5 sm:flex">
        {steps.map((s, i) => {
          const n = i + 1;
          const st = statusOf(n);
          const clickable = (st === "done" || st === "error") && n <= visited;
          const prevDone = n > 1 && statusOf(n - 1) === "done";

          const inner = (
            <>
              <span
                className={cn(
                  "relative z-[1] flex size-9 items-center justify-center rounded-full text-sm font-semibold",
                  st === "pending" &&
                    "bg-surface text-muted ring-[1.5px] ring-inset ring-control-border",
                  st === "current" && "text-white",
                  st === "done" && "text-white",
                  st === "error" && "bg-surface text-danger ring-[1.5px] ring-inset ring-danger",
                )}
                style={
                  st === "current"
                    ? {
                        background: GRAD_ACTIVE,
                        boxShadow:
                          "0 0 0 5px rgba(20,95,126,0.13), 0 6px 14px rgba(15,78,105,0.34)",
                      }
                    : st === "done"
                      ? {
                          background: GRAD_DONE,
                          boxShadow: "0 2px 6px rgba(15,78,105,0.24)",
                        }
                      : st === "error"
                        ? { boxShadow: "0 0 0 5px rgba(180,35,24,0.10)" }
                        : undefined
                }
              >
                {st === "done" ? (
                  <Check className="size-[17px]" strokeWidth={2.6} />
                ) : st === "error" ? (
                  <span className="text-[0.95rem] font-bold leading-none">!</span>
                ) : (
                  n
                )}
              </span>
              <span className="flex flex-col items-center gap-0.5 text-center">
                <span
                  className={cn(
                    "text-[0.8125rem]",
                    st === "current" && "font-semibold text-brand-legible",
                    st === "done" && "font-medium text-fg",
                    st === "pending" && "font-medium text-muted",
                    st === "error" && "font-semibold text-danger",
                    clickable && "group-hover/step:underline",
                  )}
                >
                  {s.name}
                </span>
                <span
                  className={cn(
                    "text-[0.6875rem]",
                    st === "current"
                      ? "font-medium text-brand"
                      : st === "error"
                        ? "font-medium text-danger"
                        : "text-faint",
                  )}
                >
                  {s.sub}
                </span>
              </span>
              <span className="sr-only">
                {`${t("wizStepOf", { n, total })}: ${s.name}, ${stateWord(st)}`}
              </span>
            </>
          );

          return (
            <li
              key={s.name}
              className="relative flex flex-1 flex-col items-center"
              aria-current={st === "current" ? "step" : undefined}
            >
              {n > 1 && (
                <span
                  aria-hidden
                  className="absolute left-[-50%] right-1/2 top-[16.5px] h-[3px] rounded-full transition-[background] duration-[320ms] ease-out"
                  style={{
                    background: prevDone ? GRAD_CONNECTOR : "var(--stepper-track)",
                  }}
                />
              )}
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onGo(n)}
                  className="group/step flex cursor-pointer flex-col items-center gap-[11px] outline-none focus-visible:ring-[3px] focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {inner}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-[11px]">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Panel({
  hidden,
  title,
  hint,
  children,
}: {
  hidden: boolean;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div hidden={hidden} className="space-y-5">
      <div>
        <h2 className="text-[1.0625rem] font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-muted">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function ChoiceRow({
  name,
  value,
  checked,
  onChange,
  title,
  desc,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  desc?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors",
        checked
          ? "border-brand bg-brand-subtle/60"
          : "border-line hover:border-line-strong hover:bg-surface-2",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 shrink-0 border-line text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
      />
      <span className="min-w-0">
        <span className="block font-medium text-fg">{title}</span>
        {desc && <span className="mt-0.5 block text-xs text-muted">{desc}</span>}
      </span>
    </label>
  );
}

function ReviewRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <dt className="text-muted">{term}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
