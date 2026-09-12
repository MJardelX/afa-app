"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { errorMessage } from "@/lib/errors";
import { medicalSchema } from "@/lib/schemas/medical";
import { createClient } from "@/lib/supabase/server";
import { currentProfile, isAdmin } from "@/server/players";

export type MedicalState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function guardarFichaMedica(
  _prev: MedicalState,
  formData: FormData,
): Promise<MedicalState> {
  const tp = await getTranslations("players");
  const tf = await getTranslations("forms");
  const profile = await currentProfile();
  if (!profile || !isAdmin(profile.rol)) return { error: tp("adminOnly") };

  const jugadorId = String(formData.get("jugador_id") ?? "");
  if (!jugadorId) return { error: tp("adminOnly") };

  const parsed = medicalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "outOfRange";
    return { error: tf.has(msg) ? tf(msg) : tf("outOfRange") };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fichas_medicas").upsert(
    {
      jugador_id: jugadorId,
      ...parsed.data,
      actualizado_por: profile.id,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "jugador_id" },
  );

  if (error) return { error: await errorMessage(error) };

  revalidatePath(`/players/${jugadorId}`);
  return { ok: true };
}
