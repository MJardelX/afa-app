"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { errorMessage } from "@/lib/errors";
import {
  playerSchema,
  statusSchema,
  wizardEnrollmentSchema,
} from "@/lib/schemas/player";
import { guardianSchema } from "@/lib/schemas/tutor";
import { createClient } from "@/lib/supabase/server";
import { activeSeason, currentProfile, isAdmin } from "@/server/players";
import { searchAllowed } from "@/server/throttle";

export type PlayerFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export type TutorMatch = {
  id: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  email: string | null;
  childName: string | null;
} | null;

/** Looks up a guardian by DPI so the create form can prefill + link instead
 *  of creating a duplicate. Called from the client as the DPI is typed. */
export async function lookupTutorByDpi(dpi: string): Promise<TutorMatch> {
  if (!(await searchAllowed())) return null;
  const clean = dpi.replace(/[^0-9]/g, "").slice(0, 20);
  if (clean.length < 5) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tutores")
    .select(
      "id, nombres, apellidos, telefono, email, jugador_tutor(jugadores(nombres, apellidos))",
    )
    .eq("dpi", clean)
    .maybeSingle();

  if (!data) return null;

  const link = Array.isArray(data.jugador_tutor) ? data.jugador_tutor[0] : null;
  const child = (link?.jugadores ?? null) as
    | { nombres: string; apellidos: string }
    | null;

  return {
    id: data.id,
    nombres: data.nombres,
    apellidos: data.apellidos,
    telefono: data.telefono,
    email: data.email,
    childName: child ? `${child.nombres} ${child.apellidos}` : null,
  };
}

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

function playerFields(v: ReturnType<typeof playerSchema.parse>) {
  return {
    nombres: v.nombres,
    apellidos: v.apellidos,
    fecha_nacimiento: v.fecha_nacimiento,
    lugar_nacimiento: v.lugar_nacimiento,
    direccion: v.direccion,
    ...(v.fecha_ingreso ? { fecha_ingreso: v.fecha_ingreso } : {}),
    observaciones: v.observaciones,
  };
}

function readPlayer(formData: FormData) {
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  delete raw.id;
  return raw;
}

const MED_FIELDS = ["alergias", "enfermedades", "medicamentos", "observaciones"] as const;

/** Reads the `med_*`-prefixed medical inputs from the wizard's last step. */
function readMedical(formData: FormData) {
  const out: Record<string, string> = {};
  for (const f of MED_FIELDS) {
    const raw = String(formData.get(`med_${f}`) ?? "").trim();
    if (raw) out[f] = raw.slice(0, 2000);
  }
  return out;
}

/**
 * The "new player" wizard submits everything in one go: player identity, the
 * primary guardian, an optional medical record, the season category (age
 * default or a deliberate exception) and an optional team. The player is always
 * registered for the active season — with a team or without one yet.
 *
 * Best-effort past the player insert: if a later step fails the player still
 * exists, so we land on the profile with a warning rather than losing the work.
 */
export async function crearJugadorCompleto(
  _prev: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const tp = await getTranslations("players");
  const tf = await getTranslations("forms");
  const profile = await requireAdmin();
  if (!profile) return { error: tp("adminOnly") };

  const parsed = playerSchema.safeParse(readPlayer(formData));
  const guardian = guardianSchema.safeParse(Object.fromEntries(formData));
  const enroll = wizardEnrollmentSchema.safeParse(Object.fromEntries(formData));

  const errs: Record<string, string> = {};
  if (!parsed.success) Object.assign(errs, await fieldErrors(parsed.error.issues));
  if (!guardian.success) {
    Object.assign(errs, await fieldErrors(guardian.error.issues));
  } else if (!guardian.data.g_tutor_id) {
    // Guardian is optional: leave dpi/nombres/apellidos all blank to skip it.
    // Start filling in any one of them and the trio becomes required together.
    const g = guardian.data;
    if (g.g_dpi || g.g_nombres || g.g_apellidos) {
      if (!g.g_dpi) errs.g_dpi = tf("required");
      if (!g.g_nombres) errs.g_nombres = tf("required");
      if (!g.g_apellidos) errs.g_apellidos = tf("required");
    }
  }
  if (!enroll.success) Object.assign(errs, await fieldErrors(enroll.error.issues));
  if (!parsed.success || !guardian.success || !enroll.success || Object.keys(errs).length) {
    return { fieldErrors: errs };
  }

  const v = parsed.data;
  const g = guardian.data;
  const e = enroll.data;
  const supabase = await createClient();

  const season = await activeSeason();
  if (!season) return { error: tp("noSeason") };

  const { data, error } = await supabase
    .from("jugadores")
    .insert({
      // Filled by the fn_asignar_codigo_jugador trigger.
      codigo: "",
      academia_id: profile.academia_id,
      creado_por: profile.id,
      ...playerFields(v),
    })
    .select("id, academia_id")
    .single();

  if (error || !data) return { error: await errorMessage(error) };

  // Primary guardian — link the matched tutor, or the one with this DPI, or a
  // new one. Everything below is RLS-scoped to the academy.
  let tutorId: string | null = null;
  if (g.g_tutor_id) {
    const { data: byId } = await supabase
      .from("tutores")
      .select("id")
      .eq("id", g.g_tutor_id)
      .maybeSingle();
    tutorId = byId?.id ?? null;
  }
  if (!tutorId) {
    const { data: found } = await supabase
      .from("tutores")
      .select("id")
      .eq("academia_id", data.academia_id)
      .eq("dpi", g.g_dpi)
      .maybeSingle();
    tutorId = found?.id ?? null;
  }
  if (!tutorId && g.g_nombres) {
    const { data: nt } = await supabase
      .from("tutores")
      .insert({
        academia_id: data.academia_id,
        nombres: g.g_nombres,
        apellidos: g.g_apellidos,
        dpi: g.g_dpi,
        telefono: g.g_telefono,
        email: g.g_email,
      })
      .select("id")
      .single();
    tutorId = nt?.id ?? null;
  }

  if (tutorId) {
    await supabase.from("jugador_tutor").insert({
      jugador_id: data.id,
      tutor_id: tutorId,
      parentesco: g.g_parentesco,
      es_contacto_principal: true,
      autoriza_retiro: true,
    });
  }

  // Medical record — only if the family gave anything.
  const med = readMedical(formData);
  if (Object.keys(med).length) {
    await supabase.from("fichas_medicas").upsert(
      {
        jugador_id: data.id,
        ...med,
        actualizado_por: profile.id,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "jugador_id" },
    );
  }

  // Season registration — always. `categoria_id` is forced to the team's
  // category by tg_inscripcion_categoria when a team is set.
  const { error: enrollErr } = await supabase.from("inscripciones").insert({
    jugador_id: data.id,
    temporada_id: season.id,
    equipo_id: e.equipo_id,
    categoria_id: e.categoria_final_id,
    es_principal: true,
    estado: "activa",
    numero_camiseta: e.equipo_id ? e.numero_camiseta : null,
    posicion: e.equipo_id ? e.posicion : null,
    motivo_excepcion: e.es_excepcion ? e.motivo_excepcion : null,
    creado_por: profile.id,
    // Derived by tg_inscripcion_fecha_alta when null.
    fecha_alta: null as unknown as string,
  });

  revalidatePath("/players");
  revalidatePath("/", "layout");
  redirect(
    `/players/${data.id}?saved=1${enrollErr ? "&warn=enroll" : ""}`,
  );
}

export async function actualizarJugador(
  _prev: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const tp = await getTranslations("players");
  const profile = await requireAdmin();
  if (!profile) return { error: tp("adminOnly") };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: tp("adminOnly") };

  const parsed = playerSchema.safeParse(readPlayer(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("jugadores")
    .update(playerFields(parsed.data))
    .eq("id", id);

  if (error) return { error: await errorMessage(error) };

  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  redirect(`/players/${id}?saved=1`);
}

/** Plain form action for the profile page's withdraw / reactivate button. */
export async function cambiarEstadoJugador(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;

  const id = String(formData.get("id") ?? "");
  const estado = statusSchema.safeParse(formData.get("estado"));
  if (!id || !estado.success) return;

  const supabase = await createClient();
  await supabase.from("jugadores").update({ estado: estado.data }).eq("id", id);

  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
}
