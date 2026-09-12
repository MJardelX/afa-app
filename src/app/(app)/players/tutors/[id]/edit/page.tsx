import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { TutorForm } from "@/components/tutors/tutor-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { currentProfile, isAdmin } from "@/server/players";
import { getTutor } from "@/server/tutors";

export async function generateMetadata() {
  const t = await getTranslations("tutors");
  return { title: `${t("editTitle")} · AFA Manager` };
}

export default async function EditTutorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("tutors");

  const [profile, tutor] = await Promise.all([currentProfile(), getTutor(id)]);
  if (!tutor) notFound();

  if (!isAdmin(profile?.rol)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted">{t("adminOnly")}</p>
        <Link
          href={`/players/tutors/${id}`}
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
        title={t("editTitle")}
        description={`${tutor.nombres} ${tutor.apellidos}`}
        action={
          <Link
            href={`/players/tutors/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </Link>
        }
      />
      <Card>
        <TutorForm mode="edit" tutor={tutor} />
      </Card>
    </div>
  );
}
