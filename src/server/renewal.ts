import { createClient } from "@/lib/supabase/server";

export type RenewalPreviewRow = {
  jugadorId: string;
  codigo: string;
  nombre: string;
  equipoAnterior: string | null;
  categoriaAnterior: string | null;
  categoriaSugerida: string | null;
  categoriaSugeridaId: string | null;
  edadDeportivaNueva: number | null;
  egresa: boolean;
  estabaFueraCategoria: boolean;
};

/**
 * Simulates advancing every actively-enrolled player from the season before
 * `destinoTemporadaId` into it — read-only, writes nothing (`preview_renovacion`
 * is a plain `stable` SQL function). Returns [] if there's no season exactly
 * one year before the destination for this academy.
 */
export async function previewRenovacion(
  destinoTemporadaId: string,
): Promise<RenewalPreviewRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preview_renovacion", {
    p_temporada_destino: destinoTemporadaId,
  });
  if (error) throw error;

  return (data ?? []).map((r) => ({
    jugadorId: r.jugador_id,
    codigo: r.codigo ?? "",
    nombre: r.nombre_completo ?? "",
    equipoAnterior: r.equipo_anterior,
    categoriaAnterior: r.categoria_anterior,
    categoriaSugerida: r.categoria_sugerida,
    categoriaSugeridaId: r.categoria_sugerida_id,
    edadDeportivaNueva: r.edad_deportiva_nueva,
    egresa: r.egresa ?? false,
    estabaFueraCategoria: r.estaba_fuera_categoria ?? false,
  }));
}
