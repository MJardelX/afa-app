import { createClient } from "@/lib/supabase/server";

type Row<T> = T extends (infer U)[] ? U : T;

/** Supabase types an embedded to-one as `T | T[]`; collapse it. */
function one<T>(v: T | T[] | null): Row<T> | null {
  if (Array.isArray(v)) return (v[0] ?? null) as Row<T> | null;
  return (v ?? null) as Row<T> | null;
}

export async function listCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select(
      "id, nombre, edad_min, edad_max, orden, color, dias_entreno, hora_entreno, lugar_entreno, activa, entrenador_id, auxiliar_id, entrenador:perfiles!categorias_entrenador_id_fkey(nombre_completo), auxiliar:perfiles!categorias_auxiliar_id_fkey(nombre_completo)",
    )
    .order("orden")
    .order("edad_min");

  return (data ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    edad_min: c.edad_min,
    edad_max: c.edad_max,
    orden: c.orden,
    color: c.color,
    dias_entreno: c.dias_entreno,
    hora_entreno: c.hora_entreno,
    lugar_entreno: c.lugar_entreno,
    activa: c.activa,
    entrenador_id: c.entrenador_id,
    auxiliar_id: c.auxiliar_id,
    entrenadorNombre: one(c.entrenador)?.nombre_completo ?? null,
    auxiliarNombre: one(c.auxiliar)?.nombre_completo ?? null,
  }));
}

export async function listSeasons() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("temporadas")
    .select("id, nombre, anio, fecha_inicio, fecha_fin, activa, cerrada")
    .order("anio", { ascending: false })
    .order("fecha_inicio", { ascending: false });
  return data ?? [];
}

export async function listPeriods(temporadaId: string) {
  if (!temporadaId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("periodos_evaluacion")
    .select("id, temporada_id, nombre, fecha_inicio, fecha_fin, orden, cerrado")
    .eq("temporada_id", temporadaId)
    .order("orden")
    .order("fecha_inicio");
  return data ?? [];
}

export async function listCriteria() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("criterios_evaluacion")
    .select(
      "id, dimension, nombre, descripcion, peso, escala_max, orden, activo, rubrica",
    )
    .order("dimension")
    .order("orden");
  return data ?? [];
}

/** Row counts for the settings hub cards. */
export async function settingsCounts() {
  const supabase = await createClient();
  const q = (table: "categorias" | "temporadas" | "periodos_evaluacion" | "criterios_evaluacion") =>
    supabase.from(table).select("id", { count: "exact", head: true });

  const [cats, seasons, periods, criteria] = await Promise.all([
    q("categorias"),
    q("temporadas"),
    q("periodos_evaluacion"),
    q("criterios_evaluacion"),
  ]);

  return {
    categories: cats.count ?? 0,
    seasons: seasons.count ?? 0,
    periods: periods.count ?? 0,
    criteria: criteria.count ?? 0,
  };
}
