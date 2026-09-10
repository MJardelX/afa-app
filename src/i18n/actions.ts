"use server";

import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE, type Locale } from "./config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Persists the language choice. The next render picks it up via request.ts. */
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    maxAge: ONE_YEAR,
    path: "/",
    sameSite: "lax",
  });
}
