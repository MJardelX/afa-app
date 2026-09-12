import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { SettingsNav } from "@/components/settings/settings-nav";
import { currentProfile, isAdmin } from "@/server/players";

export default async function SettingsSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("settings");
  const profile = await currentProfile();
  const admin = isAdmin(profile?.rol);
  const director = profile?.rol === "director";

  return (
    <div className="space-y-5">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {t("title")}
      </Link>

      <SettingsNav showAudit={director} />

      {!admin && (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
          {t("readOnly")}
        </p>
      )}

      {children}
    </div>
  );
}
