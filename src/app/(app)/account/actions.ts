"use server";

import { getTranslations } from "next-intl/server";

import { isRateLimited, rateLimit } from "@/lib/rate-limit";
import { passwordChangeSchema } from "@/lib/schemas/account";
import { createClient } from "@/lib/supabase/server";

export type PasswordChangeState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

const ATTEMPT_LIMIT = 5;
const WINDOW_MS = 15 * 60_000;

async function fieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
) {
  const tf = await getTranslations("forms");
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !out[key]) {
      out[key] = tf.has(i.message) ? tf(i.message) : tf("required");
    }
  }
  return out;
}

export async function changePassword(
  _prev: PasswordChangeState,
  formData: FormData,
): Promise<PasswordChangeState> {
  const t = await getTranslations("account");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: t("securityError") };

  // Brute-force brake on the current-password check below, per account.
  const key = `pwchange:${user.id}`;
  if (isRateLimited(key, ATTEMPT_LIMIT)) {
    return { error: t("securityTooMany") };
  }

  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  // `secure_password_change` is off for this project, so Supabase won't ask
  // for the current password on its own — re-authenticating here is what
  // actually stops a hijacked session from changing the password unchecked.
  // This re-issues the session cookie; it doesn't invalidate anything.
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  });
  if (authError) {
    rateLimit(key, ATTEMPT_LIMIT, WINDOW_MS);
    return { fieldErrors: { current_password: t("securityWrongCurrent") } };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });
  if (updateError) {
    const weak =
      updateError.code === "weak_password" ||
      updateError.message.toLowerCase().includes("weak");
    return { error: weak ? t("securityWeak") : t("securityError") };
  }

  return { ok: true };
}
