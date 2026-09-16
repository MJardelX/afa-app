import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: t("name"),
    description: t("tagline"),
  };
}

// Runs before paint: without this, someone who chose the dark theme sees a
// white flash on every load, and the sidebar snaps shut after hydration. Must
// stay inline and synchronous.
const bootScript = `try{var d=document.documentElement;var t=localStorage.getItem("afa-theme");if(t==="dark"||t==="light")d.dataset.theme=t;d.dataset.sidebar=localStorage.getItem("afa-sidebar")==="closed"?"closed":"open"}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  // Per-request CSP nonce, set by the middleware.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-fg">
        {/* Top progress bar on every navigation, so a slow page always gives
            immediate feedback instead of a frozen screen. Covers <Link>/<a>
            clicks on its own (it listens for clicks and reads the target
            href); a plain router.push() from a <select> or a button — not
            wrapped in an anchor — needs the drop-in useRouter from
            "nextjs-toploader/app" instead of "next/navigation" at the call
            site (see calendar.tsx, calendar-filters.tsx, period-select.tsx,
            periods-manager.tsx for the pattern). The nonce isn't strictly
            required — style-src keeps 'unsafe-inline' in both environments —
            but passing it costs nothing and matches how the boot script
            above is nonced. */}
        <NextTopLoader
          color="linear-gradient(90deg, var(--brand), var(--brand-hover))"
          height={3}
          showSpinner={false}
          shadow="0 0 10px var(--brand), 0 0 5px var(--brand-hover)"
          nonce={nonce}
        />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
