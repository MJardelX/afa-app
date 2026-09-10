import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/components/login-form";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export async function generateMetadata() {
  const t = await getTranslations("login");
  return { title: t("metaTitle") };
}

export default async function LoginPage() {
  const t = await getTranslations("login");
  const tApp = await getTranslations("app");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      <section className="relative flex items-center justify-center overflow-hidden px-5 py-12 sm:px-10">
        <Halos />

        <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2 sm:bottom-8 sm:right-8">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="relative w-full max-w-[23rem]">
          {/* On mobile the brand panel is hidden: the logo goes here. */}
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <Logo className="size-24" />
            <h1 className="mt-3 text-lg font-semibold tracking-tight">
              {tApp("name")}
            </h1>
            <p className="text-sm text-muted">{tApp("academy")}</p>
          </div>

          <div className="glass overflow-hidden rounded-2xl p-6 sm:p-7">
            <div className="mb-6 hidden lg:block">
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("welcomeBack")}
              </h2>
              <p className="mt-1.5 text-sm text-muted">{t("subtitle")}</p>
            </div>

            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted">
            {t("accountsNote")}
            <br />
            {t("troubleNote")}
          </p>
        </div>
      </section>
    </div>
  );
}

/**
 * Very diffuse color blobs behind the card. Not gratuitous decoration: they
 * are what the blur has to refract. Without them the glass is not perceptible.
 */
function Halos() {
  return (
    <div aria-hidden className="halos absolute inset-0">
      <div className="halo halo-a -right-20 top-[-10%] size-[26rem]" />
      <div className="halo halo-b -left-24 bottom-[-8%] size-[22rem]" />
      <div className="halo halo-c bottom-[18%] right-[-15%] size-[20rem]" />
    </div>
  );
}

async function BrandPanel() {
  const t = await getTranslations();
  const year = String(new Date().getFullYear());

  return (
    <aside className="relative hidden overflow-hidden bg-sky-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* No sky-900 or 950: below 800 the blue stops reading as sky and turns
          navy, which is not the academy's color. Text always sits on sky-700
          -> 6.1:1 with white. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-sky-500 via-sky-600 to-sky-800"
      />
      <div
        aria-hidden
        className="absolute -left-32 -top-40 size-[34rem] rounded-full bg-sky-300/25 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-56 -right-32 size-[30rem] rounded-full bg-sky-800/50 blur-3xl"
      />

      {/* Center pitch circle, bleeding outside the edge on purpose: it reads as
          a design decision and not an accidental crop. */}
      <svg
        aria-hidden
        viewBox="0 0 500 500"
        className="absolute -bottom-40 -right-40 size-[38rem] text-white/15"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="250" cy="250" r="200" strokeWidth="1.5" />
        <circle cx="250" cy="250" r="140" strokeWidth="1.5" />
        <circle cx="250" cy="250" r="6" fill="currentColor" stroke="none" />
      </svg>

      <div className="relative flex items-center gap-3.5">
        <Logo className="size-16" />
        <span className="text-base font-semibold uppercase tracking-[0.18em] text-white">
          Amistad
        </span>
      </div>

      <div className="relative">
        <span className="block h-1 w-14 rounded-full bg-yellow-400" />
        <h1 className="mt-7 text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-white">
          {t("app.name")}
        </h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-white">
          {t("app.tagline")}
        </p>

        <ul className="mt-10 space-y-4">
          {[t("login.feature1"), t("login.feature2"), t("login.feature3")].map(
            (item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-[0.95rem] text-white"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-yellow-400">
                  <svg viewBox="0 0 20 20" className="size-3.5 fill-sky-900">
                    <path d="M7.6 14.2 3.8 10.4l1.4-1.4 2.4 2.4 6.2-6.2 1.4 1.4-7.6 7.6Z" />
                  </svg>
                </span>
                {item}
              </li>
            ),
          )}
        </ul>
      </div>

      <p className="relative text-xs text-sky-100">
        {t("app.copyright", { year })}
      </p>
    </aside>
  );
}
