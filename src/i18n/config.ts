/** Supported UI languages. English is the default; Spanish is the translation. */
export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie that holds the chosen language. Read on every request by request.ts. */
export const LOCALE_COOKIE = "afa-locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}
