"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isRateLimited, rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request-ip";
import { createClient } from "@/lib/supabase/server";

const IP_LIMIT = 10;
const EMAIL_LIMIT = 5;

export async function signIn(_prev: unknown, formData: FormData) {
  const t = await getTranslations("login");

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: t("errorMissingFields") };
  }

  // Brute-force / credential-stuffing brake: per IP and per targeted account.
  // Only *failed* attempts count, so a legit user logging in and out repeatedly
  // is never locked out.
  const ip = await requestIp();
  const ipKey = `login:ip:${ip}`;
  const emailKey = `login:email:${email}`;
  if (isRateLimited(ipKey, IP_LIMIT) || isRateLimited(emailKey, EMAIL_LIMIT)) {
    return { error: t("errorTooManyAttempts") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    rateLimit(ipKey, IP_LIMIT, 10 * 60_000);
    rateLimit(emailKey, EMAIL_LIMIT, 15 * 60_000);

    // The user is given a deliberately generic message: telling "unknown
    // email" apart from "wrong password" would let someone probe which emails
    // are registered.
    //
    // The real error is logged on the server, though. Without this, a config
    // failure (bad URL, stack down, expired key) looks identical to a wrong
    // password and gets diagnosed blind.
    console.error("[login] authentication failure:", {
      code: error.code,
      status: error.status,
      message: error.message,
    });

    const isCredentialError =
      error.code === "invalid_credentials" ||
      error.code === "email_not_confirmed";

    return {
      error: isCredentialError
        ? t("errorBadCredentials")
        : t("errorConnection"),
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
