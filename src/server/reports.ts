import { createClient } from "@/lib/supabase/server";

export type AttendanceRankRow = {
  jugadorId: string;
  nombre: string;
  codigo: string;
  equipoId: string;
  equipo: string;
  categoriaId: string;
  categoria: string;
  categoriaColor: string;
  porcentaje: number;
  puestoEquipo: number;
  puestoCategoria: number;
  sesionesConvocadas: number;
  presentes: number;
  tardes: number;
  ausentes: number;
};

/**
 * Attendance leaderboard for the season — RLS already scopes this to what
 * the caller can see (admin: everyone; coach: their teams' categories only),
 * same as the calendar and assessment modules.
 */
export async function listAttendanceRanking(
  temporadaId: string,
): Promise<AttendanceRankRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_ranking_equipo")
    .select(
      "jugador_id, nombre_completo, codigo, equipo_id, equipo, categoria_id, categoria, categoria_color, porcentaje, puesto_equipo, puesto_categoria, sesiones_convocadas, presentes, tardes, ausentes",
    )
    .eq("temporada_id", temporadaId)
    .order("categoria")
    .order("puesto_categoria");

  return (data ?? [])
    .filter((r) => r.jugador_id && r.equipo_id && r.categoria_id)
    .map((r) => ({
      jugadorId: r.jugador_id as string,
      nombre: r.nombre_completo ?? "",
      codigo: r.codigo ?? "",
      equipoId: r.equipo_id as string,
      equipo: r.equipo ?? "—",
      categoriaId: r.categoria_id as string,
      categoria: r.categoria ?? "—",
      categoriaColor: r.categoria_color ?? "#94a3b8",
      porcentaje: r.porcentaje ?? 0,
      puestoEquipo: r.puesto_equipo ?? 0,
      puestoCategoria: r.puesto_categoria ?? 0,
      sesionesConvocadas: r.sesiones_convocadas ?? 0,
      presentes: r.presentes ?? 0,
      tardes: r.tardes ?? 0,
      ausentes: r.ausentes ?? 0,
    }));
}

export type EvaluationRankRow = {
  jugadorId: string;
  nombre: string;
  codigo: string;
  equipoId: string | null;
  equipo: string | null;
  categoriaId: string | null;
  categoria: string | null;
  categoriaColor: string;
  promedio: number;
  dimensiones: Record<string, number>;
  puestoCategoria: number;
};

/**
 * Evaluation leaderboard for a period: averages `v_evaluacion_dimension`
 * across dimensions per player (only finalized evaluations count, since
 * that view already filters to those), then ranks within category.
 */
export async function listEvaluationRanking(
  periodoId: string,
): Promise<EvaluationRankRow[]> {
  const supabase = await createClient();
  const { data: dims } = await supabase
    .from("v_evaluacion_dimension")
    .select("jugador_id, dimension, promedio")
    .eq("periodo_id", periodoId);
  if (!dims || dims.length === 0) return [];

  const byPlayer = new Map<string, { sum: number; count: number; dims: Record<string, number> }>();
  for (const d of dims) {
    if (d.promedio == null || !d.jugador_id || !d.dimension) continue;
    const cur = byPlayer.get(d.jugador_id) ?? { sum: 0, count: 0, dims: {} };
    cur.sum += d.promedio;
    cur.count += 1;
    cur.dims[d.dimension] = d.promedio;
    byPlayer.set(d.jugador_id, cur);
  }
  if (!byPlayer.size) return [];

  const { data: players } = await supabase
    .from("v_jugadores")
    .select("id, nombre_completo, codigo, equipo_id, equipo, categoria_id, categoria")
    .in("id", [...byPlayer.keys()]);

  const { data: categories } = await supabase
    .from("categorias")
    .select("id, color");
  const colorById = new Map((categories ?? []).map((c) => [c.id, c.color]));

  const rows: EvaluationRankRow[] = (players ?? [])
    .filter((p) => p.id)
    .map((p) => {
      const agg = byPlayer.get(p.id as string)!;
      return {
        jugadorId: p.id as string,
        nombre: p.nombre_completo ?? "",
        codigo: p.codigo ?? "",
        equipoId: p.equipo_id,
        equipo: p.equipo,
        categoriaId: p.categoria_id,
        categoria: p.categoria,
        categoriaColor: (p.categoria_id && colorById.get(p.categoria_id)) || "#94a3b8",
        promedio: Math.round((agg.sum / agg.count) * 100) / 100,
        dimensiones: agg.dims,
        puestoCategoria: 0,
      };
    });

  // Rank within category (players without a current team land in a "—" bucket).
  const byCategory = new Map<string, EvaluationRankRow[]>();
  for (const r of rows) {
    const key = r.categoriaId ?? "—";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(r);
  }
  for (const group of byCategory.values()) {
    group.sort((a, b) => b.promedio - a.promedio);
    group.forEach((r, i) => {
      r.puestoCategoria = i + 1;
    });
  }

  return rows.sort((a, b) => {
    const catCmp = (a.categoria ?? "").localeCompare(b.categoria ?? "");
    return catCmp !== 0 ? catCmp : a.puestoCategoria - b.puestoCategoria;
  });
}
