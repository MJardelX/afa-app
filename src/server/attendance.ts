import { createClient } from "@/lib/supabase/server";
import { activeSeason } from "@/server/players";

type Row<T> = T extends (infer U)[] ? U : T;

/** Supabase types an embedded to-one as `T | T[]`; collapse it. */
function one<T>(v: T | T[] | null): Row<T> | null {
  if (Array.isArray(v)) return (v[0] ?? null) as Row<T> | null;
  return (v ?? null) as Row<T> | null;
}

export type CalendarCategory = {
  id: string;
  nombre: string;
  color: string;
  diasEntreno: string[] | null;
  horaEntreno: string | null;
  lugarEntreno: string | null;
};

/** Active categories, with their weekly training schedule. */
export async function listCalendarCategories(): Promise<CalendarCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select("id, nombre, color, dias_entreno, hora_entreno, lugar_entreno")
    .eq("activa", true)
    .order("orden");

  return (data ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    color: c.color,
    diasEntreno: c.dias_entreno,
    horaEntreno: c.hora_entreno,
    lugarEntreno: c.lugar_entreno,
  }));
}

export type CalendarTeam = {
  id: string;
  nombre: string;
  categoriaId: string;
  categoria: string;
  color: string;
  entrenadorId: string | null;
  auxiliarId: string | null;
};

/** Active-season teams — for the match-type session form and team filter. */
export async function listCalendarTeams(): Promise<CalendarTeam[]> {
  const supabase = await createClient();
  const season = await activeSeason();
  if (!season) return [];

  const { data } = await supabase
    .from("equipos")
    .select(
      "id, nombre, categoria_id, entrenador_id, auxiliar_id, categoria:categorias(nombre, color)",
    )
    .eq("temporada_id", season.id)
    .eq("activo", true)
    .order("nombre");

  return (data ?? []).map((t) => {
    const cat = one(t.categoria);
    return {
      id: t.id,
      nombre: t.nombre,
      categoriaId: t.categoria_id,
      categoria: cat?.nombre ?? "—",
      color: cat?.color ?? "#0ea5e9",
      entrenadorId: t.entrenador_id,
      auxiliarId: t.auxiliar_id,
    };
  });
}

export type CalendarSessionItem = {
  id: string;
  tipo: string;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  lugar: string | null;
  rival: string | null;
  estado: string;
  categoriaId: string | null;
  categoria: string;
  color: string;
  equipoId: string | null;
  equipo: string | null;
};

/** Sessions with `fecha` in [from, to] (inclusive), for the calendar grid. */
export async function listSessions(
  from: string,
  to: string,
): Promise<CalendarSessionItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sesiones")
    .select(
      "id, categoria_id, equipo_id, tipo, fecha, hora_inicio, hora_fin, lugar, rival, estado, categoria:categorias(nombre, color), equipos(nombre, categorias(nombre, color))",
    )
    .gte("fecha", from)
    .lte("fecha", to)
    .order("fecha")
    .order("hora_inicio");

  return (data ?? []).map((s) => {
    const directCat = one(s.categoria);
    const eq = one(s.equipos);
    const eqCat = eq ? one(eq.categorias) : null;
    const cat = directCat ?? eqCat;
    return {
      id: s.id,
      tipo: s.tipo,
      fecha: s.fecha,
      horaInicio: s.hora_inicio,
      horaFin: s.hora_fin,
      lugar: s.lugar,
      rival: s.rival,
      estado: s.estado,
      categoriaId: s.categoria_id,
      categoria: cat?.nombre ?? "—",
      color: cat?.color ?? "#94a3b8",
      equipoId: s.equipo_id,
      equipo: eq?.nombre ?? null,
    };
  });
}

export type SessionDetail = {
  id: string;
  tipo: string;
  categoriaId: string | null;
  categoria: string;
  color: string;
  equipoId: string | null;
  equipo: string | null;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  lugar: string | null;
  rival: string | null;
  notas: string | null;
  estado: string;
  temporadaId: string;
};

export async function getSession(id: string): Promise<SessionDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sesiones")
    .select(
      "id, categoria_id, equipo_id, tipo, fecha, hora_inicio, hora_fin, lugar, rival, notas, estado, temporada_id, categoria:categorias(nombre, color), equipos(nombre, categorias(nombre, color))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const directCat = one(data.categoria);
  const eq = one(data.equipos);
  const eqCat = eq ? one(eq.categorias) : null;
  const cat = directCat ?? eqCat;

  return {
    id: data.id,
    tipo: data.tipo,
    categoriaId: data.categoria_id,
    categoria: cat?.nombre ?? "—",
    color: cat?.color ?? "#94a3b8",
    equipoId: data.equipo_id,
    equipo: eq?.nombre ?? null,
    fecha: data.fecha,
    horaInicio: data.hora_inicio,
    horaFin: data.hora_fin,
    lugar: data.lugar,
    rival: data.rival,
    notas: data.notas,
    estado: data.estado,
    temporadaId: data.temporada_id,
  };
}

/** Whether `profile` coaches at least one active-season team in this category. */
export async function canManageCategory(
  categoriaId: string | null,
  profile: { id: string; rol: string } | null,
) {
  if (!profile || !categoriaId) return false;
  if (profile.rol === "director" || profile.rol === "coordinador") return true;

  const supabase = await createClient();
  const { data } = await supabase
    .from("equipos")
    .select("id")
    .eq("categoria_id", categoriaId)
    .or(`entrenador_id.eq.${profile.id},auxiliar_id.eq.${profile.id}`)
    .limit(1);
  return !!data && data.length > 0;
}

/** Whether `profile` may write this session (category- or team-scoped). */
export async function canManageSession(
  session: { categoriaId: string | null; equipoId: string | null },
  profile: { id: string; rol: string } | null,
) {
  if (!profile) return false;
  if (profile.rol === "director" || profile.rol === "coordinador") return true;

  if (session.equipoId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("equipos")
      .select("entrenador_id, auxiliar_id")
      .eq("id", session.equipoId)
      .maybeSingle();
    return !!data && (data.entrenador_id === profile.id || data.auxiliar_id === profile.id);
  }
  return canManageCategory(session.categoriaId, profile);
}

export type RosterPlayer = {
  jugadorId: string;
  nombres: string;
  apellidos: string;
  codigo: string;
  equipo: string | null;
};

/**
 * Everyone eligible for a session's attendance: for a training, every active
 * principal registration across every team of the category (they all train
 * together); for a match, that team's roster.
 */
export async function getSessionRoster(
  session: { categoriaId: string | null; equipoId: string | null },
  temporadaId: string,
): Promise<RosterPlayer[]> {
  const supabase = await createClient();

  if (session.equipoId) {
    const { data } = await supabase
      .from("inscripciones")
      .select("jugador_id, jugadores(nombres, apellidos, codigo)")
      .eq("equipo_id", session.equipoId)
      .eq("estado", "activa")
      .order("jugador_id");
    return (data ?? []).map((r) => {
      const j = one(r.jugadores);
      return {
        jugadorId: r.jugador_id,
        nombres: j?.nombres ?? "",
        apellidos: j?.apellidos ?? "",
        codigo: j?.codigo ?? "",
        equipo: null,
      };
    });
  }

  if (session.categoriaId) {
    // Training is by category, and the category is independent of the team:
    // a player's training group is their enrollment's `categoria_id` (falling
    // back to the team's). So we can't filter server-side on the team —
    // pull every active principal registration and match in JS.
    const { data } = await supabase
      .from("inscripciones")
      .select(
        "jugador_id, categoria_id, equipos(nombre, categoria_id), jugadores(nombres, apellidos, codigo)",
      )
      .eq("temporada_id", temporadaId)
      .eq("estado", "activa")
      .eq("es_principal", true)
      .order("jugador_id");

    const byPlayer = new Map<string, RosterPlayer>();
    for (const r of data ?? []) {
      if (byPlayer.has(r.jugador_id)) continue;
      const eq = one(r.equipos);
      const effectiveCat = r.categoria_id ?? eq?.categoria_id ?? null;
      if (effectiveCat !== session.categoriaId) continue;
      const j = one(r.jugadores);
      byPlayer.set(r.jugador_id, {
        jugadorId: r.jugador_id,
        nombres: j?.nombres ?? "",
        apellidos: j?.apellidos ?? "",
        codigo: j?.codigo ?? "",
        equipo: eq?.nombre ?? null,
      });
    }
    return [...byPlayer.values()];
  }

  return [];
}

export type AttendanceMark = {
  jugadorId: string;
  estado: string;
  minutosJugados: number | null;
  goles: number;
  asistenciasGol: number;
};

/** Existing attendance rows for a session, for prefilling the roster. */
export async function getSessionAttendance(
  sessionId: string,
): Promise<AttendanceMark[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("asistencias")
    .select("jugador_id, estado, minutos_jugados, goles, asistencias_gol")
    .eq("sesion_id", sessionId);

  return (data ?? []).map((r) => ({
    jugadorId: r.jugador_id,
    estado: r.estado,
    minutosJugados: r.minutos_jugados,
    goles: r.goles,
    asistenciasGol: r.asistencias_gol,
  }));
}
