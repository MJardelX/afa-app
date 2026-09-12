"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { errorMessage } from "@/lib/errors";
import { tutorSchema } from "@/lib/schemas/tutor";
import { createClient } from "@/lib/supabase/server";
import { currentProfile, isAdmin } from "@/server/players";

export type TutorFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

async function requireAdmin() {
  const profile = await currentProfile();
  return profile && isAdmin(profile.rol) ? profile : null;
}

async function fieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
) {
  const tf = await getTranslations("forms");
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !out[key]) {
      out[key] = tf.has(i.message) ? tf(i.message) : tf("required");
    }
  }
  return out;
}

export async function crearTutor(
  _prev: TutorFormState,
  formData: FormData,
): Promise<TutorFormState> {
  const tt = await getTranslations("tutors");
  const profile = await requireAdmin();
  if (!profile) return { error: tt("adminOnly") };

  const parsed = tutorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutores")
    .insert({ academia_id: profile.academia_id, ...parsed.data })
    .select("id")
    .single();

  if (error || !data) return { error: await errorMessage(error) };

  revalidatePath("/players/tutors");
  redirect(`/players/tutors/${data.id}`);
}

export async function actualizarTutor(
  _prev: TutorFormState,
  formData: FormData,
): Promise<TutorFormState> {
  const tt = await getTranslations("tutors");
  const profile = await requireAdmin();
  if (!profile) return { error: tt("adminOnly") };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: tt("adminOnly") };

  const parsed = tutorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutores")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: await errorMessage(error) };

  revalidatePath("/players/tutors");
  revalidatePath(`/players/tutors/${id}`);
  redirect(`/players/tutors/${id}`);
}
