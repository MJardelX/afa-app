import { getTranslations } from "next-intl/server";

import { signOut } from "@/app/login/actions";
import { AccountPreferences } from "@/components/app/account-preferences";
import { SignOutButton } from "@/components/app/sign-out-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Detail, DetailList } from "@/components/ui/detail-list";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: `${t("title")} · AFA Manager` };
}

export default async function AccountPage() {
  const t = await getTranslations("account");
  const tRoles = await getTranslations("roles");
  const th = await getTranslations("header");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: academy }] = await Promise.all([
    supabase
      .from("perfiles")
      .select("nombre_completo, rol")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
    supabase.from("academias").select("nombre").maybeSingle(),
  ]);

  const name = profile?.nombre_completo ?? "—";
  const role = profile?.rol ?? "";
  const roleLabel = tRoles.has(role) ? tRoles(role) : role;

  return (
    <div className="space-y-6">
      {/* Identity — the page's header, not a card */}
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={name} size="lg" />
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-faint">
            {t("title")}
          </p>
          <h1 className="mt-0.5 truncate text-xl font-semibold tracking-tight">
            {name}
          </h1>
          <Badge tone="brand" className="mt-1.5">
            {roleLabel}
          </Badge>
        </div>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>{t("detailsTitle")}</CardTitle>
          <DetailList>
            <Detail term={t("email")}>{user?.email ?? "—"}</Detail>
            <Detail term={t("academy")}>{academy?.nombre ?? "—"}</Detail>
          </DetailList>
        </Card>

        <Card>
          <CardTitle>{t("prefsTitle")}</CardTitle>
          <AccountPreferences />
        </Card>
      </div>

      <div className="border-t border-line pt-4">
        <form action={signOut}>
          <SignOutButton label={th("signOut")} />
        </form>
      </div>
    </div>
  );
}
