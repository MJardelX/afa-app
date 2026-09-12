import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LockKeyhole } from "lucide-react";

import { BottomNav } from "@/components/app/bottom-nav";
import { Header } from "@/components/app/header";
import { Sidebar } from "@/components/app/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("perfiles")
    .select("nombre_completo, rol, activo")
    .eq("id", user.id)
    .single();

  // A user without a profile, or with a disabled profile, has no academy: RLS
  // would return everything empty. Better to say so than to show zeros.
  if (!profile || !profile.activo) return <NoAccess email={user.email} />;

  const { data: season } = await supabase
    .from("temporadas")
    .select("nombre")
    .eq("activa", true)
    .maybeSingle();

  return (
    // Floating chrome: the shell padding + gaps are what separate the sidebar
    // and topbar into their own rounded glass panels, with the aurora showing
    // through the space between them.
    <div className="flex min-h-dvh gap-3 p-3 lg:gap-5 lg:p-5">
      <div className="app-bg" aria-hidden />
      <Sidebar
        season={season?.nombre}
        name={profile.nombre_completo}
        role={profile.rol}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
        <Header name={profile.nombre_completo} season={season?.nombre} />
        {/* One content column for every screen: same max width and side
            gutters everywhere, so moving list -> detail -> form never shifts
            the frame. Breathing room above every page's title too — the
            dashboard opts back out with a matching negative margin. */}
        <main className="flex-1 pb-24 pt-4 lg:pb-1 lg:pt-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

async function NoAccess({ email }: { email?: string }) {
  const t = await getTranslations("noAccess");

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-sm rounded-2xl border border-line bg-surface p-7 text-center">
        <span
          aria-hidden
          className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-accent text-accent-fg"
        >
          <LockKeyhole className="size-5" strokeWidth={1.6} />
        </span>
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t("body", { email: email ?? "" })}
        </p>
      </div>
    </main>
  );
}
