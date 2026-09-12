import { createClient } from "@/lib/supabase/server";

export async function listCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select(
      "id, nombre, edad_min, edad_max, orden, color, dias_entreno, hora_entreno, lugar_entreno, activa",
    )
    .order("orden")
    .order("edad_min");
  return data ?? [];
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
