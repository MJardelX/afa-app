"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { errorMessage } from "@/lib/errors";
import { relationshipSchema } from "@/lib/schemas/tutor";
import { createClient } from "@/lib/supabase/server";
import { currentProfile, isAdmin } from "@/server/players";

export type GuardianState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

async function requireAdmin() {
  const profile = await currentProfile();
  return profile && isAdmin(profile.rol) ? profile : null;
}

/** Registered guardians matching a term, minus those already on this player. */
export async function buscarTutores(jugadorId: string, term: string) {
  const t = term.replace(/[%,()]/g, "").trim();
  if (t.length < 2) return [];

  const supabase = await createClient();
  const { data: linked } = await supabase
    .from("jugador_tutor")
    .select("tutor_id")
    .eq("jugador_id", jugadorId);
  const exclude = (linked ?? []).map((l) => l.tutor_id);

  let query = supabase
    .from("tutores")
    .select("id, nombres, apellidos, telefono, dpi")
    .or(
      `nombres.ilike.%${t}%,apellidos.ilike.%${t}%,telefono.ilike.%${t}%,dpi.ilike.%${t}%`,
    )
    .limit(8);

  if (exclude.length) query = query.not("id", "in", `(${exclude.join(",")})`);

  const { data } = await query;
  return data ?? [];
}

export async function vincularTutor(
  _prev: GuardianState,
  formData: FormData,
): Promise<GuardianState> {
  const tp = await getTranslations("players");
  const tf = await getTranslations("forms");
  const profile = await requireAdmin();
  if (!profile) return { error: tp("adminOnly") };

  const jugadorId = String(formData.get("jugador_id") ?? "");
  const mode = String(formData.get("mode") ?? "existing");
  const parentesco = relationshipSchema.safeParse(formData.get("parentesco"));
  const autorizaRetiro = formData.get("autoriza_retiro") === "on";
  if (!jugadorId || !parentesco.success) return { error: tf("required") };

  const supabase = await createClient();
  let tutorId: string | null = null;

  if (mode === "existing") {
    tutorId = String(formData.get("tutor_id") ?? "") || null;
    if (tutorId) {
      const { data } = await supabase
        .from("tutores")
        .select("id")
        .eq("id", tutorId)
        .maybeSingle();
      tutorId = data?.id ?? null;
    }
    if (!tutorId) return { fieldErrors: { tutor_id: tf("required") } };
  } else {
    const nombres = String(formData.get("nombres") ?? "").trim();
    const apellidos = String(formData.get("apellidos") ?? "").trim();
    const dpi = String(formData.get("dpi") ?? "").trim() || null;
    const telefono = String(formData.get("telefono") ?? "").trim() || null;
    const email = String(formData.get("email") ?? "").trim() || null;

    // Additional guardians only need a name — the DPI is optional here (the
    // primary guardian's DPI is captured and required on the create form).
    const fe: Record<string, string> = {};
    if (nombres.length < 2) fe.nombres = tf("tooShort");
    if (apellidos.length < 2) fe.apellidos = tf("tooShort");
    if (Object.keys(fe).length) return { fieldErrors: fe };

    // Reuse an existing tutor with this DPI, else create one.
    if (dpi) {
      const { data: found } = await supabase
        .from("tutores")
        .select("id")
        .eq("academia_id", profile.academia_id)
        .eq("dpi", dpi)
        .maybeSingle();
      tutorId = found?.id ?? null;
    }

    if (!tutorId) {
      const { data: nt, error } = await supabase
        .from("tutores")
        .insert({
          academia_id: profile.academia_id,
          nombres,
          apellidos,
          dpi,
          telefono,
          email,
        })
        .select("id")
        .single();
      if (error || !nt) return { error: await errorMessage(error) };
      tutorId = nt.id;
    }
  }

  const { error } = await supabase.from("jugador_tutor").insert({
    jugador_id: jugadorId,
    tutor_id: tutorId,
    parentesco: parentesco.data,
    autoriza_retiro: autorizaRetiro,
    es_contacto_principal: false,
  });
  if (error) return { error: await errorMessage(error) };

  revalidatePath(`/players/${jugadorId}`);
  revalidatePath(`/players/tutors/${tutorId}`);
  return { ok: true };
}

/** Plain form action. */
export async function desvincularTutor(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;
  const jugadorId = String(formData.get("jugador_id") ?? "");
  const tutorId = String(formData.get("tutor_id") ?? "");
  if (!jugadorId || !tutorId) return;

  const supabase = await createClient();
  await supabase
    .from("jugador_tutor")
    .delete()
    .eq("jugador_id", jugadorId)
    .eq("tutor_id", tutorId);

  revalidatePath(`/players/${jugadorId}`);
  revalidatePath(`/players/tutors/${tutorId}`);
}

/** Plain form action. Unsets the current primary, then sets the new one. */
export async function hacerContactoPrincipal(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;
  const jugadorId = String(formData.get("jugador_id") ?? "");
  const tutorId = String(formData.get("tutor_id") ?? "");
  if (!jugadorId || !tutorId) return;

  const supabase = await createClient();
  await supabase
    .from("jugador_tutor")
    .update({ es_contacto_principal: false })
    .eq("jugador_id", jugadorId)
    .eq("es_contacto_principal", true);
  await supabase
    .from("jugador_tutor")
    .update({ es_contacto_principal: true })
    .eq("jugador_id", jugadorId)
    .eq("tutor_id", tutorId);

  revalidatePath(`/players/${jugadorId}`);
}
