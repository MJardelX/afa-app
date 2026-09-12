import { createClient } from "@/lib/supabase/server";
import { activeSeason } from "@/server/players";

type Row<T> = T extends (infer U)[] ? U : T;

/** Supabase types an embedded to-one as `T | T[]`; collapse it. */
function one<T>(v: T | T[] | null): Row<T> | null {
  if (Array.isArray(v)) return (v[0] ?? null) as Row<T> | null;
  return (v ?? null) as Row<T> | null;
}

/** Whether `profile` coaches the team(s) `jugadorId` is actively enrolled in. */
export async function canEvaluatePlayer(
  jugadorId: string,
  profile: { id: string; rol: string } | null,
): Promise<boolean> {
  if (!profile) return false;
  if (profile.rol === "director" || profile.rol === "coordinador") return true;

  const season = await activeSeason();
  if (!season) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("inscripciones")
    .select("equipos(entrenador_id, auxiliar_id)")
    .eq("jugador_id", jugadorId)
    .eq("temporada_id", season.id)
    .eq("estado", "activa");

  return (data ?? []).some((r) => {
    const eq = one(r.equipos);
    return !!eq && (eq.entrenador_id === profile.id || eq.auxiliar_id === profile.id);
  });
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

export type TeamEvalSummary = { finalizadas: number; total: number };

/** Roster size + how many this evaluator has finalized, per team, for a period. */
export async function listTeamEvaluationCounts(
  teamIds: string[],
  periodoId: string,
  evaluadorId: string,
): Promise<Map<string, TeamEvalSummary>> {
  const out = new Map<string, TeamEvalSummary>(
    teamIds.map((id) => [id, { finalizadas: 0, total: 0 }]),
  );
  if (!teamIds.length) return out;

  const supabase = await createClient();
  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("jugador_id, equipo_id")
    .in("equipo_id", teamIds)
    .eq("estado", "activa");

  const teamByPlayer = new Map<string, string>();
  for (const r of inscripciones ?? []) {
    if (!r.equipo_id) continue;
    out.get(r.equipo_id)!.total += 1;
    teamByPlayer.set(r.jugador_id, r.equipo_id);
  }
  if (!teamByPlayer.size) return out;

  const { data: evals } = await supabase
    .from("evaluaciones")
    .select("jugador_id")
    .eq("periodo_id", periodoId)
    .eq("evaluador_id", evaluadorId)
    .eq("estado", "finalizada")
    .in("jugador_id", [...teamByPlayer.keys()]);

  for (const e of evals ?? []) {
    const teamId = teamByPlayer.get(e.jugador_id);
    if (teamId) out.get(teamId)!.finalizadas += 1;
  }
  return out;
}

export type PlayerEvalStatus = {
  jugadorId: string;
  nombres: string;
  apellidos: string;
  codigo: string;
  estado: "borrador" | "finalizada" | null;
};

/** A team's active roster with this evaluator's status per player for a period. */
export async function getTeamEvaluationRoster(
  teamId: string,
  periodoId: string,
  evaluadorId: string,
): Promise<PlayerEvalStatus[]> {
  const supabase = await createClient();
  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("jugador_id, jugadores(nombres, apellidos, codigo)")
    .eq("equipo_id", teamId)
    .eq("estado", "activa")
    .order("jugador_id");

  const players = (inscripciones ?? []).map((r) => {
    const j = one(r.jugadores);
    return {
      jugadorId: r.jugador_id,
      nombres: j?.nombres ?? "",
      apellidos: j?.apellidos ?? "",
      codigo: j?.codigo ?? "",
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
