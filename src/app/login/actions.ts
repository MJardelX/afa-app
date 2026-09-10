"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";

export async function signIn(_prev: unknown, formData: FormData) {
  const t = await getTranslations("login");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: t("errorMissingFields") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
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
