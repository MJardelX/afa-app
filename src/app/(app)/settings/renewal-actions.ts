"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { errorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { previewRenovacion, type RenewalPreviewRow } from "@/server/renewal";
import { currentProfile, isAdmin } from "@/server/players";

export type RenewalResult =
  | { ok: true; renovados: number; egresados: number; omitidos: number }
  | { error: string };

/** Thin admin-gated wrapper so the client panel can load a preview on demand. */
export async function cargarVistaPrevia(
  destinoTemporadaId: string,
): Promise<{ rows: RenewalPreviewRow[] } | { error: string }> {
  const ts = await getTranslations("settings");
  const profile = await currentProfile();
  if (!profile || !isAdmin(profile.rol)) return { error: ts("adminOnly") };

  const rows = await previewRenovacion(destinoTemporadaId).catch(() => null);
  if (rows === null) return { error: ts("renewalPreviewError") };
  return { rows };
}

/**
 * Advances every actively-enrolled player from the season before
 * `destinoTemporadaId` into it: players who age out of every category get
 * `jugadores.estado = 'egresado'`; everyone else gets a new principal
 * registration for the destination season, without a team (`equipo_id`
 * null) — there's no way to know which literal team they'll land on until
 * someone builds this season's squads. Safe to re-run: players who already
 * have a destination registration, or are already egresado, are skipped.
 */
export async function ejecutarRenovacion(
  destinoTemporadaId: string,
  activarDestino: boolean,
): Promise<RenewalResult> {
  const ts = await getTranslations("settings");
  const profile = await currentProfile();
  if (!profile || !isAdmin(profile.rol)) return { error: ts("adminOnly") };

  const preview = await previewRenovacion(destinoTemporadaId).catch(() => null);
  if (!preview || !preview.length) return { error: ts("renewalNothing") };

  const supabase = await createClient();

  const graduate = [...new Set(preview.filter((r) => r.egresa).map((r) => r.jugadorId))];
  const renew = preview.filter((r) => !r.egresa);

  let egresados = 0;
  if (graduate.length) {
    const { data, error } = await supabase
      .from("jugadores")
      .update({ estado: "egresado" })
      .in("id", graduate)
      .neq("estado", "egresado")
      .select("id");
    if (error) return { error: await errorMessage(error) };
    egresados = data?.length ?? 0;
  }

  let renovados = 0;
  let omitidos = 0;
  if (renew.length) {
    const { data: already } = await supabase
      .from("inscripciones")
      .select("jugador_id")
      .eq("temporada_id", destinoTemporadaId)
      .eq("es_principal", true)
      .eq("estado", "activa")
      .in(
        "jugador_id",
        renew.map((r) => r.jugadorId),
      );
    const alreadySet = new Set((already ?? []).map((r) => r.jugador_id));

    const rows = renew
      .filter((r) => !alreadySet.has(r.jugadorId))
      .map((r) => ({
        jugador_id: r.jugadorId,
        temporada_id: destinoTemporadaId,
        // Each player lands in the category their sporting age maps to for the
        // new season (last year's exceptions are reset).
        categoria_id: r.categoriaSugeridaId,
        es_principal: true,
        estado: "activa" as const,
        // Derived by the tg_inscripcion_fecha_alta trigger when null.
        fecha_alta: null as unknown as string,
      }));
    omitidos = renew.length - rows.length;

    if (rows.length) {
      const { error } = await supabase.from("inscripciones").insert(rows);
      if (error) return { error: await errorMessage(error) };
      renovados = rows.length;
    }
  }

  if (activarDestino) {
    await supabase
      .from("temporadas")
      .update({ activa: false })
      .eq("activa", true)
      .neq("id", destinoTemporadaId);
    await supabase.from("temporadas").update({ activa: true }).eq("id", destinoTemporadaId);
  }

  revalidatePath("/", "layout");
  return { ok: true, renovados, egresados, omitidos };
}
