import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale } from "./config";
import { LOCALE_COOKIE } from "./config";

/**
 * Resolves the active locale per request from the language cookie, falling back
 * to the default. No locale is encoded in the URL: this is a single-audience app
 * where the language is a user preference, not a routing concern.
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieValue) ? cookieValue : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
