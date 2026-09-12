"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { errorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { activeSeason, currentProfile, isAdmin } from "@/server/players";

export type EnrollmentState = { ok?: boolean; error?: string } | null;

/**
 * Changes the category a player is enrolled in for the active season. The
 * category is independent of the team — a player can be on a Sub-12 squad for
 * matches while training with Sub-10. Admin only.
 */
export async function cambiarCategoriaInscripcion(
  _prev: EnrollmentState,
  formData: FormData,
): Promise<EnrollmentState> {
  const tp = await getTranslations("players");
  const profile = await currentProfile();
  if (!profile || !isAdmin(profile.rol)) return { error: tp("adminOnly") };

  const jugadorId = String(formData.get("jugador_id") ?? "");
  const categoriaId = String(formData.get("categoria_id") ?? "");
  const motivo = String(formData.get("motivo_excepcion") ?? "").trim();
  if (!jugadorId || !categoriaId) return { error: tp("adminOnly") };

  const supabase = await createClient();

  const season = await activeSeason();
  if (!season) return { error: tp("noSeason") };

  // The target must be an active category of this academy.
  const { data: cat } = await supabase
    .from("categorias")
    .select("id")
    .eq("id", categoriaId)
    .eq("academia_id", profile.academia_id)
    .eq("activa", true)
    .maybeSingle();
  if (!cat) return { error: tp("enrCategoryInvalid") };

  // The player's active principal registration for the active season.
  const { data: insc } = await supabase
    .from("inscripciones")
    .select("id")
    .eq("jugador_id", jugadorId)
    .eq("temporada_id", season.id)
    .eq("es_principal", true)
    .eq("estado", "activa")
    .maybeSingle();
  if (!insc) return { error: tp("enrNotEnrolled") };

  const { error } = await supabase
    .from("inscripciones")
    .update({
      categoria_id: categoriaId,
      motivo_excepcion: motivo ? motivo.slice(0, 300) : null,
    })
    .eq("id", insc.id);
  if (error) return { error: await errorMessage(error) };

  revalidatePath(`/players/${jugadorId}`);
  revalidatePath("/players");
  revalidatePath("/", "layout");
  return { ok: true };
}
