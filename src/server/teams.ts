import { createClient } from "@/lib/supabase/server";

/** Squad member that can be assigned as a team's coach or assistant. */
export type TeamStaff = { id: string; nombre_completo: string; rol: string };

type Row<T> = T extends (infer U)[] ? U : T;

/** Supabase types an embedded to-one as `T | T[]`; collapse it. */
function one<T>(v: T | T[] | null): Row<T> | null {
  if (Array.isArray(v)) return (v[0] ?? null) as Row<T> | null;
  return (v ?? null) as Row<T> | null;
}

export type TeamListItem = {
  id: string;
  nombre: string;
  activo: boolean;
  coachName: string | null;
  playerCount: number;
};

export type TeamGroup = {
  categoriaId: string;
  categoria: string;
  color: string;
  edadMin: number | null;
  edadMax: number | null;
  diasEntreno: string[] | null;
  horaEntreno: string | null;
  lugarEntreno: string | null;
  teams: TeamListItem[];
};

/** Active-season teams grouped by category (ordered by `categorias.orden`). */
export async function listTeams(): Promise<{
  season: { id: string; nombre: string; anio: number } | null;
  groups: TeamGroup[];
}> {
  const supabase = await createClient();

  const { data: season } = await supabase
    .from("temporadas")
    .select("id, nombre, anio")
    .eq("activa", true)
    .maybeSingle();
  if (!season) return { season: null, groups: [] };

  const { data: teams, error } = await supabase
    .from("equipos")
    .select(
      "id, nombre, activo, categoria_id, categoria:categorias(nombre, orden, color, edad_min, edad_max, dias_entreno, hora_entreno, lugar_entreno), entrenador:perfiles!equipos_entrenador_id_fkey(nombre_completo)",
    )
    .eq("temporada_id", season.id)
    .order("nombre");
  if (error) throw error;

  const ids = (teams ?? []).map((t) => t.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: ins } = await supabase
      .from("inscripciones")
      .select("equipo_id")
      .eq("temporada_id", season.id)
      .eq("estado", "activa")
      .eq("es_principal", true)
      .in("equipo_id", ids);
    for (const r of ins ?? []) {
      if (r.equipo_id) counts.set(r.equipo_id, (counts.get(r.equipo_id) ?? 0) + 1);
    }
  }

  const groups = new Map<string, TeamGroup & { orden: number }>();
  for (const t of teams ?? []) {
    const cat = one(t.categoria);
    const key = t.categoria_id;
    if (!groups.has(key)) {
      groups.set(key, {
        categoriaId: key,
        categoria: cat?.nombre ?? "—",
        color: cat?.color ?? "#0ea5e9",
        edadMin: cat?.edad_min ?? null,
        edadMax: cat?.edad_max ?? null,
        diasEntreno: cat?.dias_entreno ?? null,
        horaEntreno: cat?.hora_entreno ?? null,
        lugarEntreno: cat?.lugar_entreno ?? null,
        orden: cat?.orden ?? 999,
        teams: [],
      });
    }
    groups.get(key)!.teams.push({
      id: t.id,
      nombre: t.nombre,
      activo: t.activo,
      coachName: one(t.entrenador)?.nombre_completo ?? null,
      playerCount: counts.get(t.id) ?? 0,
    });
  }

  return {
    season,
    groups: [...groups.values()]
      .sort((a, b) => a.orden - b.orden)
      .map((g) => ({
        categoriaId: g.categoriaId,
        categoria: g.categoria,
        color: g.color,
        edadMin: g.edadMin,
        edadMax: g.edadMax,
        diasEntreno: g.diasEntreno,
        horaEntreno: g.horaEntreno,
        lugarEntreno: g.lugarEntreno,
        teams: g.teams,
      })),
  };
}

/** Raw `equipos` row for the edit form. */
export async function getTeam(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipos")
    .select(
      "id, nombre, categoria_id, entrenador_id, auxiliar_id, activo, temporada_id",
    )
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** Team header (name + category + coach) for the roster page. */
export async function getTeamHeader(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipos")
    .select(
      "id, nombre, activo, temporada_id, categoria_id, categoria:categorias(nombre, edad_min, edad_max, color, dias_entreno, hora_entreno, lugar_entreno), entrenador:perfiles!equipos_entrenador_id_fkey(nombre_completo), auxiliar:perfiles!equipos_auxiliar_id_fkey(nombre_completo)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const cat = one(data.categoria);
  return {
    id: data.id,
    nombre: data.nombre,
    activo: data.activo,
    temporada_id: data.temporada_id,
    categoria_id: data.categoria_id,
    categoria: cat?.nombre ?? "—",
    categoriaColor: cat?.color ?? "#0ea5e9",
    diasEntreno: cat?.dias_entreno ?? null,
    horaEntreno: cat?.hora_entreno ?? null,
    lugarEntreno: cat?.lugar_entreno ?? null,
    edadMin: cat?.edad_min ?? null,
    edadMax: cat?.edad_max ?? null,
    coachName: one(data.entrenador)?.nombre_completo ?? null,
    assistantName: one(data.auxiliar)?.nombre_completo ?? null,
  };
}

/** Active-season enrolled players for a team. */
export async function getTeamRoster(teamId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inscripciones")
    .select(
      "id, numero_camiseta, posicion, fecha_alta, estado, es_principal, jugador_id, jugadores(nombres, apellidos, codigo, fecha_nacimiento, estado)",
    )
    .eq("equipo_id", teamId)
    .eq("estado", "activa")
    .order("numero_camiseta", { nullsFirst: false });
  return (data ?? []).map((r) => {
    const j = one(r.jugadores);
    return {
      inscripcionId: r.id,
      jugadorId: r.jugador_id,
      numero: r.numero_camiseta,
      posicion: r.posicion,
      fechaAlta: r.fecha_alta,
      esPrincipal: r.es_principal,
      nombres: j?.nombres ?? "",
      apellidos: j?.apellidos ?? "",
      codigo: j?.codigo ?? "",
      fechaNacimiento: j?.fecha_nacimiento ?? null,
      estadoJugador: j?.estado ?? "activo",
    };
  });
}

export type EnrollCandidate = {
  id: string;
  nombre: string;
  codigo: string;
  edadDeportiva: number | null;
  categoriaPorEdad: string | null;
  categoriaPorEdadId: string | null;
  currentTeamId: string | null;
  currentTeam: string | null;
  inscripcionId: string | null;
};

/**
 * Active players matching `term`, for enrolling into `teamId`. Players already
 * on this team are excluded; players on another team come back with their
 * current team so the UI can offer a transfer.
 */
export async function searchEnrollCandidates(
  term: string,
  teamId: string,
): Promise<EnrollCandidate[]> {
  const t = term.replace(/[%,()]/g, "").trim();
  if (t.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_jugadores")
    .select(
      "id, nombre_completo, codigo, edad_deportiva, categoria_por_edad, categoria_por_edad_id, equipo_id, equipo, inscripcion_id",
    )
    .or(`nombres.ilike.%${t}%,apellidos.ilike.%${t}%,codigo.ilike.%${t}%`)
    .eq("estado", "activo")
    .limit(10);

  return (data ?? [])
    .filter((p) => p.id && p.equipo_id !== teamId)
    .map((p) => ({
      id: p.id as string,
      nombre: p.nombre_completo ?? "",
      codigo: p.codigo ?? "",
      edadDeportiva: p.edad_deportiva,
      categoriaPorEdad: p.categoria_por_edad,
      categoriaPorEdadId: p.categoria_por_edad_id,
      currentTeamId: p.equipo_id,
      currentTeam: p.equipo,
      inscripcionId: p.inscripcion_id,
    }));
}

/** Profiles that can be assigned to a team. */
export async function teamStaff(): Promise<TeamStaff[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, rol")
    .in("rol", ["entrenador", "coordinador", "director"])
    .eq("activo", true)
    .order("nombre_completo");
  return data ?? [];
}
