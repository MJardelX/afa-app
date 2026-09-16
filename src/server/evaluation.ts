import { createClient } from "@/lib/supabase/server";

type Row<T> = T extends (infer U)[] ? U : T;

/** Supabase types an embedded to-one as `T | T[]`; collapse it. */
function one<T>(v: T | T[] | null): Row<T> | null {
  if (Array.isArray(v)) return (v[0] ?? null) as Row<T> | null;
  return (v ?? null) as Row<T> | null;
}

/**
 * Whether `profile` may evaluate players at all. Any coach can run training
 * or take attendance for any training group, so evaluation isn't scoped to
 * a specific group/team assignment either — matches the `evaluacion_lectura`/
 * `evaluacion_escritura` RLS policies, which are the actual enforcement.
 */
export function canEvaluatePlayer(profile: { rol: string } | null): boolean {
  if (!profile) return false;
  return profile.rol === "director" || profile.rol === "coordinador" || profile.rol === "entrenador";
}

export type EvalCriterion = {
  id: string;
  dimension: string;
  nombre: string;
  descripcion: string | null;
  escalaMax: number;
  peso: number;
  rubrica: Record<string, string> | null;
  orden: number;
};

/** Active criteria only — inactive ones don't belong on a scoring form. */
export async function listActiveCriteria(): Promise<EvalCriterion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("criterios_evaluacion")
    .select("id, dimension, nombre, descripcion, escala_max, peso, rubrica, orden")
    .eq("activo", true)
    .order("dimension")
    .order("orden");

  return (data ?? []).map((c) => ({
    id: c.id,
    dimension: c.dimension,
    nombre: c.nombre,
    descripcion: c.descripcion,
    escalaMax: c.escala_max,
    peso: c.peso,
    rubrica: c.rubrica as Record<string, string> | null,
    orden: c.orden,
  }));
}

export type CategoriaEvalSummary = { finalizadas: number; total: number };

/** Roster size + how many this evaluator has finalized, per training group, for a period. */
export async function listCategoriaEvaluationCounts(
  categoriaIds: string[],
  periodoId: string,
  evaluadorId: string,
): Promise<Map<string, CategoriaEvalSummary>> {
  const out = new Map<string, CategoriaEvalSummary>(
    categoriaIds.map((id) => [id, { finalizadas: 0, total: 0 }]),
  );
  if (!categoriaIds.length) return out;

  const supabase = await createClient();
  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("jugador_id, categoria_id")
    .in("categoria_id", categoriaIds)
    .eq("estado", "activa");

  const categoriaByPlayer = new Map<string, string>();
  for (const r of inscripciones ?? []) {
    if (!r.categoria_id) continue;
    out.get(r.categoria_id)!.total += 1;
    categoriaByPlayer.set(r.jugador_id, r.categoria_id);
  }
  if (!categoriaByPlayer.size) return out;

  const { data: evals } = await supabase
    .from("evaluaciones")
    .select("jugador_id")
    .eq("periodo_id", periodoId)
    .eq("evaluador_id", evaluadorId)
    .eq("estado", "finalizada")
    .in("jugador_id", [...categoriaByPlayer.keys()]);

  for (const e of evals ?? []) {
    const categoriaId = categoriaByPlayer.get(e.jugador_id);
    if (categoriaId) out.get(categoriaId)!.finalizadas += 1;
  }
  return out;
}

export type PlayerEvalStatus = {
  jugadorId: string;
  nombres: string;
  apellidos: string;
  codigo: string;
  equipo: string | null;
  estado: "borrador" | "finalizada" | null;
};

/** A training group's active roster (whether or not each player has a team
 *  yet) with this evaluator's status per player for a period. */
export async function getCategoriaEvaluationRoster(
  categoriaId: string,
  periodoId: string,
  evaluadorId: string,
): Promise<PlayerEvalStatus[]> {
  const supabase = await createClient();
  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("jugador_id, jugadores(nombres, apellidos, codigo), equipos(nombre)")
    .eq("categoria_id", categoriaId)
    .eq("estado", "activa")
    .order("jugador_id");

  const players = (inscripciones ?? []).map((r) => {
    const j = one(r.jugadores);
    const eq = one(r.equipos);
    return {
      jugadorId: r.jugador_id,
      nombres: j?.nombres ?? "",
      apellidos: j?.apellidos ?? "",
      codigo: j?.codigo ?? "",
      equipo: eq?.nombre ?? null,
    };
  });
  if (!players.length) return [];

  const { data: evals } = await supabase
    .from("evaluaciones")
    .select("jugador_id, estado")
    .eq("periodo_id", periodoId)
    .eq("evaluador_id", evaluadorId)
    .in(
      "jugador_id",
      players.map((p) => p.jugadorId),
    );
  const statusByPlayer = new Map((evals ?? []).map((e) => [e.jugador_id, e.estado]));

  return players.map((p) => ({
    ...p,
    estado: (statusByPlayer.get(p.jugadorId) as "borrador" | "finalizada" | undefined) ?? null,
  }));
}

export type EvaluationForm = {
  estado: "borrador" | "finalizada" | null;
  comentarioGeneral: string | null;
  scores: Record<string, number>;
};

/** The current evaluator's evaluation of a player for a period, if any. */
export async function getPlayerEvaluation(
  jugadorId: string,
  periodoId: string,
  evaluadorId: string,
): Promise<EvaluationForm> {
  const supabase = await createClient();
  const { data: ev } = await supabase
    .from("evaluaciones")
    .select("id, estado, comentario_general")
    .eq("jugador_id", jugadorId)
    .eq("periodo_id", periodoId)
    .eq("evaluador_id", evaluadorId)
    .maybeSingle();

  if (!ev) return { estado: null, comentarioGeneral: null, scores: {} };

  const { data: detalle } = await supabase
    .from("evaluacion_detalle")
    .select("criterio_id, puntaje")
    .eq("evaluacion_id", ev.id);

  const scores: Record<string, number> = {};
  for (const d of detalle ?? []) scores[d.criterio_id] = Number(d.puntaje);

  return {
    estado: ev.estado as "borrador" | "finalizada",
    comentarioGeneral: ev.comentario_general,
    scores,
  };
}
