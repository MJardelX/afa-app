import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, rangeFor } from "@/lib/pagination";

/** Guardian rows + how many players each is linked to. */
export async function listTutors({ q, page = 1 }: { q?: string; page?: number }) {
  const supabase = await createClient();
  const [from, to] = rangeFor(page);

  let query = supabase
    .from("tutores")
    .select("id, nombres, apellidos, dpi, telefono, email, jugador_tutor(count)", {
      count: "exact",
    })
    .order("apellidos")
    .order("nombres")
    .range(from, to);

  const term = (q ?? "").replace(/[%,()]/g, "").trim();
  if (term) {
    query = query.or(
      `nombres.ilike.%${term}%,apellidos.ilike.%${term}%,telefono.ilike.%${term}%,dpi.ilike.%${term}%`,
    );
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((r) => ({
      ...r,
      children:
        (Array.isArray(r.jugador_tutor) ? r.jugador_tutor[0]?.count : 0) ?? 0,
    })),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function getTutor(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutores")
    .select(
      "id, nombres, apellidos, dpi, telefono, telefono_alt, email, ocupacion, lugar_trabajo, direccion",
    )
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** Players linked to a guardian (with derived category from v_jugadores). */
export async function tutorChildren(tutorId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jugador_tutor")
    .select(
      "parentesco, es_contacto_principal, autoriza_retiro, jugador_id, jugadores(nombres, apellidos, codigo, estado)",
    )
    .eq("tutor_id", tutorId);
  return data ?? [];
}

/** Guardians linked to a player (for the player profile). */
export async function playerGuardians(jugadorId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jugador_tutor")
    .select(
      "parentesco, es_contacto_principal, autoriza_retiro, tutor_id, tutores(id, nombres, apellidos, telefono, telefono_alt, email, dpi)",
    )
    .eq("jugador_id", jugadorId)
    .order("es_contacto_principal", { ascending: false });
  return data ?? [];
}

/** Typeahead for linking an existing guardian. */
export async function searchTutors(term: string, limit = 8) {
  const t = term.replace(/[%,()]/g, "").trim();
  if (t.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutores")
    .select("id, nombres, apellidos, telefono, dpi")
    .or(
      `nombres.ilike.%${t}%,apellidos.ilike.%${t}%,telefono.ilike.%${t}%,dpi.ilike.%${t}%`,
    )
    .limit(limit);
  return data ?? [];
}
