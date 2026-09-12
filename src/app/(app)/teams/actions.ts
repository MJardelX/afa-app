"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { errorMessage } from "@/lib/errors";
import { enrollmentSchema, teamSchema } from "@/lib/schemas/team";
import { createClient } from "@/lib/supabase/server";
import { activeSeason, currentProfile, isAdmin } from "@/server/players";
import {
  searchEnrollCandidates,
  type EnrollCandidate,
} from "@/server/teams";
import { searchAllowed } from "@/server/throttle";

export type TeamFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

async function requireAdmin() {
  const profile = await currentProfile();
  return profile && isAdmin(profile.rol) ? profile : null;
}

async function fieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
) {
  const tf = await getTranslations("forms");
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !out[key]) {
      out[key] = tf.has(i.message) ? tf(i.message) : tf("required");
    }
  }
  return out;
}

function readTeam(formData: FormData) {
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  delete raw.id;
  return raw;
}

function teamFields(v: ReturnType<typeof teamSchema.parse>) {
  return {
    categoria_id: v.categoria_id,
    nombre: v.nombre,
    entrenador_id: v.entrenador_id,
    auxiliar_id: v.auxiliar_id,
    activo: v.activo,
  };
}

export async function crearEquipo(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const tt = await getTranslations("teams");
  const profile = await requireAdmin();
  if (!profile) return { error: tt("adminOnly") };

  const parsed = teamSchema.safeParse(readTeam(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const season = await activeSeason();
  if (!season) return { error: tt("noSeason") };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equipos")
    .insert({
      academia_id: profile.academia_id,
      temporada_id: season.id,
      ...teamFields(parsed.data),
    })
    .select("id")
    .single();

  if (error || !data) return { error: await errorMessage(error) };

  revalidatePath("/teams");
  redirect(`/teams/${data.id}?saved=1`);
}

export async function actualizarEquipo(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const tt = await getTranslations("teams");
  const profile = await requireAdmin();
  if (!profile) return { error: tt("adminOnly") };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: tt("adminOnly") };

  const parsed = teamSchema.safeParse(readTeam(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("equipos")
    .update(teamFields(parsed.data))
    .eq("id", id);

  if (error) return { error: await errorMessage(error) };

  revalidatePath("/teams");
  revalidatePath(`/teams/${id}`);
  redirect(`/teams/${id}?saved=1`);
}

/** Plain form action for the roster page's activate / deactivate button. */
export async function cambiarEstadoEquipo(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const activo = formData.get("activo") === "true";

  const supabase = await createClient();
  await supabase.from("equipos").update({ activo }).eq("id", id);

  revalidatePath("/teams");
  revalidatePath(`/teams/${id}`);
}

// ── Roster / enrollments ────────────────────────────────────────────────────

export type RosterState = {
  ok?: boolean;
  kind?: "enrolled" | "transferred" | "updated";
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

const today = () => new Date().toISOString().slice(0, 10);

/** Typeahead for the enroll box. */
export async function buscarJugadoresParaEquipo(
  teamId: string,
  term: string,
): Promise<EnrollCandidate[]> {
  const profile = await requireAdmin();
  if (!profile || !(await searchAllowed())) return [];
  return searchEnrollCandidates(term, teamId);
}

/**
 * Enrolls a player into a team as their primary registration for the active
 * season. If they already have a primary team, that one is marked
 * `trasladado` (with a leave date) first — the transfer the UI offers.
 */
export async function inscribirJugador(
  _prev: RosterState,
  formData: FormData,
): Promise<RosterState> {
  const tt = await getTranslations("teams");
  const profile = await requireAdmin();
  if (!profile) return { error: tt("adminOnly") };

  const teamId = String(formData.get("equipo_id") ?? "");
  if (!teamId) return { error: tt("adminOnly") };

  const parsed = enrollmentSchema.safeParse({
    jugador_id: formData.get("jugador_id"),
    numero_camiseta: formData.get("numero_camiseta"),
    posicion: formData.get("posicion"),
  });
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const season = await activeSeason();
  if (!season) return { error: tt("noSeason") };

  const { jugador_id, numero_camiseta, posicion } = parsed.data;
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("inscripciones")
    .select("id, equipo_id, categoria_id")
    .eq("jugador_id", jugador_id)
    .eq("temporada_id", season.id)
    .eq("es_principal", true)
    .eq("estado", "activa")
    .maybeSingle();

  if (current?.equipo_id === teamId) {
    return { error: tt("alreadyOnTeam") };
  }

  let kind: NonNullable<RosterState>["kind"] = "enrolled";

  // Already registered but without a team → just point that row at this team.
  if (current && !current.equipo_id) {
    const { error } = await supabase
      .from("inscripciones")
      .update({ equipo_id: teamId, numero_camiseta, posicion })
      .eq("id", current.id);
    if (error) return { error: await errorMessage(error) };
    kind = "enrolled";
  } else {
    // On another team → release the old primary registration (audit trail).
    if (current) {
      const { error: relErr } = await supabase
        .from("inscripciones")
        .update({
          es_principal: false,
          estado: "trasladado",
          fecha_baja: today(),
        })
        .eq("id", current.id);
      if (relErr) return { error: await errorMessage(relErr) };
      kind = "transferred";
    }

    const { error } = await supabase.from("inscripciones").insert({
      jugador_id,
      temporada_id: season.id,
      equipo_id: teamId,
      // Category is independent of the team: keep the player's training
      // category across the transfer (the trigger fills it from the new team
      // only when it's null).
      categoria_id: current?.categoria_id ?? null,
      es_principal: true,
      estado: "activa",
      numero_camiseta,
      posicion,
      creado_por: profile.id,
      // Derived by the tg_inscripcion_fecha_alta trigger when null.
      fecha_alta: null as unknown as string,
    });
    if (error) return { error: await errorMessage(error) };
  }

  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);
  return { ok: true, kind };
}

/** Edits shirt number / position on an active enrollment. */
export async function actualizarInscripcion(
  _prev: RosterState,
  formData: FormData,
): Promise<RosterState> {
  const tt = await getTranslations("teams");
  const profile = await requireAdmin();
  if (!profile) return { error: tt("adminOnly") };

  const inscripcionId = String(formData.get("inscripcion_id") ?? "");
  const teamId = String(formData.get("equipo_id") ?? "");
  if (!inscripcionId) return { error: tt("adminOnly") };

  const parsed = enrollmentSchema.safeParse({
    jugador_id: formData.get("jugador_id") ?? "placeholder-id",
    numero_camiseta: formData.get("numero_camiseta"),
    posicion: formData.get("posicion"),
  });
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("inscripciones")
    .update({
      numero_camiseta: parsed.data.numero_camiseta,
      posicion: parsed.data.posicion,
    })
    .eq("id", inscripcionId);
  if (error) return { error: await errorMessage(error) };

  revalidatePath("/teams");
  if (teamId) revalidatePath(`/teams/${teamId}`);
  return { ok: true, kind: "updated" };
}

/** Plain form action: removes a player from a team (leaves an audit row). */
export async function darDeBaja(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;

  const inscripcionId = String(formData.get("inscripcion_id") ?? "");
  const teamId = String(formData.get("equipo_id") ?? "");
  if (!inscripcionId) return;

  const supabase = await createClient();
  await supabase
    .from("inscripciones")
    .update({ es_principal: false, estado: "baja", fecha_baja: today() })
    .eq("id", inscripcionId);

  revalidatePath("/teams");
  if (teamId) revalidatePath(`/teams/${teamId}`);
}
