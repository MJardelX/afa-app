import { PAGE_SIZE, rangeFor } from "@/lib/pagination";
import { sanitizeSearch } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

export type PlayerStatus = "activo" | "inactivo" | "retirado" | "egresado";
export type PlayerFlag = "sin_inscribir" | "sin_equipo" | "fuera_de_categoria";

export type PlayerListFilters = {
  q?: string;
  categoria?: string;
  estado?: PlayerStatus | "todos";
  flag?: PlayerFlag;
  page?: number;
};

/** One page of players from `v_jugadores` (RLS-scoped to the caller). */
export async function listPlayers(f: PlayerListFilters) {
  const supabase = await createClient();
  const page = f.page ?? 1;
  const [from, to] = rangeFor(page);

  let query = supabase
    .from("v_jugadores")
    .select(
      "id, codigo, nombres, apellidos, nombre_completo, fecha_nacimiento, estado, categoria, categoria_id, categoria_por_edad, categoria_por_edad_id, fuera_de_categoria, sin_inscribir, sin_equipo",
      { count: "exact" },
    )
    .order("apellidos")
    .order("nombres")
    .range(from, to);

  if (f.estado && f.estado !== "todos") query = query.eq("estado", f.estado);

  if (f.categoria) query = query.eq("categoria_por_edad_id", f.categoria);

  if (f.flag) query = query.eq(f.flag, true);

  const q = sanitizeSearch(f.q);
  if (q) {
    query = query.or(
      `nombres.ilike.%${q}%,apellidos.ilike.%${q}%,codigo.ilike.%${q}%`,
    );
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    rows: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

/** The active season (for the form's sporting-age preview). */
export async function activeSeason() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("temporadas")
    .select("id, nombre, anio, fecha_inicio, fecha_fin")
    .eq("activa", true)
    .maybeSingle();
  return data;
}

/** Active-season categories, for filters and the form's category preview. */
export async function activeCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select("id, nombre, edad_min, edad_max, color")
    .eq("activa", true)
    .order("orden");
  return data ?? [];
}

/** The signed-in user's profile (role gating in the UI). */
export async function currentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, rol, academia_id")
    .eq("id", user.id)
    .maybeSingle();
  return data;
}

/** The `v_jugadores` row for the profile (derived category, ages, flags). */
export async function getPlayer(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_jugadores")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** Attendance summary for the active season, from `v_asistencia_jugador`. */
export async function playerAttendance(id: string, temporadaId?: string | null) {
  if (!temporadaId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_asistencia_jugador")
    .select(
      "sesiones_convocadas, presentes, tardes, justificados, ausentes, porcentaje",
    )
    .eq("jugador_id", id)
    .eq("temporada_id", temporadaId)
    .maybeSingle();
  return data;
}

/** Medical record (1:1). RLS returns null for non-admins / non-guardians. */
export async function medicalRecord(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fichas_medicas")
    .select("*")
    .eq("jugador_id", id)
    .maybeSingle();
  return data;
}

/** Latest finalized assessment averages per dimension. */
export async function playerEvaluation(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_evaluacion_dimension")
    .select("dimension, promedio, periodo, periodo_id")
    .eq("jugador_id", id);
  return data ?? [];
}

/**
 * The raw `jugadores` row for editing — the view doesn't expose
 * `grado_escolar`, `lugar_nacimiento`, `observaciones`.
 */
export async function getPlayerEditable(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jugadores")
    .select(
      "id, codigo, nombres, apellidos, fecha_nacimiento, lugar_nacimiento, colegio, grado_escolar, direccion, fecha_ingreso, estado, observaciones, academia_id",
    )
    .eq("id", id)
    .maybeSingle();
  return data;
}

export function isAdmin(rol: string | undefined | null) {
  return rol === "director" || rol === "coordinador";
}
