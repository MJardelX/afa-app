import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { TutorForm } from "@/components/tutors/tutor-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { currentProfile, isAdmin } from "@/server/players";

export async function generateMetadata() {
  const t = await getTranslations("tutors");
  return { title: `${t("newTitle")} · AFA Manager` };
}

export default async function NewTutorPage() {
  const t = await getTranslations("tutors");
  const profile = await currentProfile();

  if (!isAdmin(profile?.rol)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted">{t("adminOnly")}</p>
        <Link
          href="/players/tutors"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-legible hover:underline"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader
        title={t("newTitle")}
        action={
          <Link
            href="/players/tutors"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </Link>
        }
      />
      <Card>
        <TutorForm mode="create" />
      </Card>
    </div>
  );
}
