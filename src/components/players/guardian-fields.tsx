"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, IdCard, LoaderCircle, Mail, Phone, User } from "lucide-react";

import { lookupTutorByDpi, type TutorMatch } from "@/app/(app)/players/actions";
import { Field, Select, TextInput } from "@/components/ui/field";
import { RELATIONSHIPS } from "@/lib/schemas/tutor";

function relKey(r: string) {
  return `rel${r[0].toUpperCase()}${r.slice(1)}` as
    | "relPadre"
    | "relMadre"
    | "relEncargado"
    | "relOtro";
}

/**
 * Primary-guardian block on the player create form. The DPI is the key: as it's
 * typed we look for an existing tutor; a match prefills and locks the name
 * fields and the player is linked to that record instead of a new one.
 *
 * No wrapper card — the fields sit in the same 2-column grid as step 1 so the
 * two steps read as one form.
 */
export function GuardianFields({
  errors,
}: {
  errors: Record<string, string>;
}) {
  const t = useTranslations("players");

  const [dpi, setDpi] = useState("");
  const [match, setMatch] = useState<TutorMatch>(null);
  const [pending, startTransition] = useTransition();
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function onDpi(value: string) {
    setDpi(value);
    clearTimeout(timer.current);
    const clean = value.trim();
    if (clean.length < 5) {
      setMatch(null);
      return;
    }
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const m = await lookupTutorByDpi(clean);
        setMatch(m);
        if (m) {
          setNombres(m.nombres);
          setApellidos(m.apellidos);
          setTelefono(m.telefono ?? "");
          setEmail(m.email ?? "");
        }
      });
    }, 400);
  }

  const locked = Boolean(match);

  return (
    <div className="grid gap-x-5 gap-y-[22px] sm:grid-cols-2">
      <input type="hidden" name="g_tutor_id" value={match?.id ?? ""} />

      <Field
        label={t("tutDpi")}
        htmlFor="g_dpi"
        optional
        error={errors.g_dpi}
        hint={!match ? t("gDpiHint") : undefined}
      >
        <div className="relative">
          <TextInput
            id="g_dpi"
            name="g_dpi"
            icon={<IdCard strokeWidth={1.6} />}
            inputMode="numeric"
            autoComplete="off"
            value={dpi}
            onChange={(e) => onDpi(e.target.value)}
            invalid={!!errors.g_dpi}
            className="pr-10"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            {pending ? (
              <LoaderCircle className="size-4 animate-spin text-muted" />
            ) : match ? (
              <CircleCheck className="size-4 text-status-good-fg" />
            ) : null}
          </span>
        </div>
      </Field>

      <Field
        label={t("tutRelationship")}
        htmlFor="g_parentesco"
        hint={t("gRelationshipHint")}
      >
        <Select id="g_parentesco" name="g_parentesco" defaultValue="encargado">
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {t(relKey(r))}
            </option>
          ))}
        </Select>
      </Field>

      {match && (
        <p className="flex items-start gap-2 rounded-lg bg-status-good-bg px-3 py-2 text-xs text-status-good-fg sm:col-span-2">
          <CircleCheck className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
          <span>
            <span className="font-medium">
              {match.childName
                ? t("gMatchOf", {
                    name: `${match.nombres} ${match.apellidos}`,
                    child: match.childName,
                  })
                : t("gMatch", { name: `${match.nombres} ${match.apellidos}` })}
            </span>
            <span className="mt-0.5 block opacity-90">{t("gMatchLinked")}</span>
          </span>
        </p>
      )}

      <Field
        label={t("gFirstName")}
        htmlFor="g_nombres"
        optional={!locked}
        error={errors.g_nombres}
      >
        <TextInput
          id="g_nombres"
          name="g_nombres"
          icon={<User strokeWidth={1.6} />}
          autoComplete="off"
          value={nombres}
          onChange={(e) => setNombres(e.target.value)}
          disabled={locked}
          invalid={!!errors.g_nombres}
        />
      </Field>
      <Field
        label={t("gLastName")}
        htmlFor="g_apellidos"
        optional={!locked}
        error={errors.g_apellidos}
      >
        <TextInput
          id="g_apellidos"
          name="g_apellidos"
          icon={<User strokeWidth={1.6} />}
          autoComplete="off"
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
          disabled={locked}
          invalid={!!errors.g_apellidos}
        />
      </Field>

      <Field label={t("tutPhone")} htmlFor="g_telefono" optional>
        <TextInput
          id="g_telefono"
          name="g_telefono"
          icon={<Phone strokeWidth={1.6} />}
          type="tel"
          inputMode="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          disabled={locked}
        />
      </Field>
      <Field label={t("tutEmail")} htmlFor="g_email" optional>
        <TextInput
          id="g_email"
          name="g_email"
          icon={<Mail strokeWidth={1.6} />}
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={locked}
        />
      </Field>
    </div>
  );
}
