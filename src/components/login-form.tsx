"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CircleAlert,
  LoaderCircle,
  Lock,
  Mail,
  type LucideIcon,
} from "lucide-react";

import { signIn } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const t = useTranslations("login");
  const [state, action, pending] = useActionState(signIn, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <Field
        id="email"
        label={t("emailLabel")}
        type="email"
        autoComplete="email"
        placeholder={t("emailPlaceholder")}
        Icon={Mail}
      />

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            {t("passwordLabel")}
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-xs font-medium text-brand-legible hover:underline"
          >
            {showPassword ? t("hide") : t("show")}
          </button>
        </div>
        <div className="relative">
          <FieldIcon Icon={Lock} />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={inputClass}
          />
        </div>
      </div>

      {state?.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-sm text-danger ring-1 ring-inset ring-danger/25"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}

const inputClass =
  "field-glass h-11 w-full rounded-lg border pl-10 pr-3 text-sm text-fg " +
  "placeholder:text-faint transition-[border-color,box-shadow] " +
  "hover:border-sky-300 focus:border-sky-500 focus:outline-none " +
  "focus:ring-2 focus:ring-sky-500/30";

function FieldIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <Icon
      className="pointer-events-none absolute left-3 top-1/2 size-[1.15rem] -translate-y-1/2 text-muted"
      strokeWidth={1.6}
    />
  );
}

function Field({
  id,
  label,
  Icon,
  ...props
}: React.ComponentProps<"input"> & {
  label: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <FieldIcon Icon={Icon} />
        <input id={id} name={id} required className={inputClass} {...props} />
      </div>
    </div>
  );
}
