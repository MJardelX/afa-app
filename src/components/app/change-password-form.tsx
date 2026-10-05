"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { KeyRound, LoaderCircle, Lock } from "lucide-react";

import {
  changePassword,
  type PasswordChangeState,
} from "@/app/(app)/account/actions";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { FormBanner } from "@/components/ui/form-banner";
import { useToast } from "@/components/ui/toast";

export function ChangePasswordForm() {
  const t = useTranslations("account");
  const [state, formAction, pending] = useActionState<
    PasswordChangeState,
    FormData
  >(changePassword, null);
  const [reveal, setReveal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const errs = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      toast(t("securitySuccess"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.ok]);

  const type = reveal ? "text" : "password";

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <Field
        label={t("currentPasswordLabel")}
        htmlFor="current_password"
        error={errs.current_password}
      >
        <TextInput
          id="current_password"
          name="current_password"
          type={type}
          autoComplete="current-password"
          required
          icon={<Lock strokeWidth={1.6} />}
          invalid={!!errs.current_password}
        />
      </Field>

      <Field
        label={t("newPasswordLabel")}
        htmlFor="new_password"
        error={errs.new_password}
        hint={!errs.new_password ? t("newPasswordHint") : undefined}
      >
        <TextInput
          id="new_password"
          name="new_password"
          type={type}
          autoComplete="new-password"
          minLength={8}
          required
          icon={<KeyRound strokeWidth={1.6} />}
          invalid={!!errs.new_password}
        />
      </Field>

      <Field
        label={t("confirmPasswordLabel")}
        htmlFor="confirm_password"
        error={errs.confirm_password}
      >
        <TextInput
          id="confirm_password"
          name="confirm_password"
          type={type}
          autoComplete="new-password"
          required
          icon={<KeyRound strokeWidth={1.6} />}
          invalid={!!errs.confirm_password}
        />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          className="text-xs font-medium text-brand-legible hover:underline"
        >
          {reveal ? t("hide") : t("show")}
        </button>
      </div>

      <FormBanner error={state?.error} />

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            {t("securitySubmitting")}
          </>
        ) : (
          t("securitySubmit")
        )}
      </Button>
    </form>
  );
}
