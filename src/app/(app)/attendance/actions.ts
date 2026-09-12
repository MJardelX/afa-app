"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { errorMessage } from "@/lib/errors";
import { generateSchema, sessionSchema } from "@/lib/schemas/attendance";
import { createClient } from "@/lib/supabase/server";
import { activeSeason, currentProfile, isAdmin } from "@/server/players";
import { canManageCategory, canManageSession } from "@/server/attendance";

const ATTENDANCE_STATES = ["presente", "tarde", "justificado", "ausente"] as const;
export type AttendanceState = (typeof ATTENDANCE_STATES)[number];

export type SessionState = {
  ok?: boolean;
  count?: number;
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

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

function addMinutes(time: string | null, minutes: number): string | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function crearSesion(
  _prev: SessionState,
  formData: FormData,
): Promise<SessionState> {
  const ta = await getTranslations("attendance");
  const profile = await currentProfile();
  if (!profile) return { error: ta("noPermission") };

  const parsed = sessionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const allowed = await canManageSession(
    { categoriaId: parsed.data.categoria_id, equipoId: parsed.data.equipo_id },
    profile,
  );
  if (!allowed) return { error: ta("noPermission") };

  const season = await activeSeason();
  if (!season) return { error: ta("noSeason") };

  const supabase = await createClient();
  const { error } = await supabase.from("sesiones").insert({
    academia_id: profile.academia_id,
    temporada_id: season.id,
    registrada_por: profile.id,
    ...parsed.data,
  });
  if (error) return { error: await errorMessage(error) };

  revalidatePath("/attendance");
  return { ok: true };
}

export async function actualizarSesion(
  _prev: SessionState,
  formData: FormData,
): Promise<SessionState> {
  const ta = await getTranslations("attendance");
  const profile = await currentProfile();
  if (!profile) return { error: ta("noPermission") };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: ta("noPermission") };

  const parsed = sessionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const allowed = await canManageSession(
    { categoriaId: parsed.data.categoria_id, equipoId: parsed.data.equipo_id },
    profile,
  );
  if (!allowed) return { error: ta("noPermission") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sesiones")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: await errorMessage(error) };

  revalidatePath("/attendance");
  revalidatePath(`/attendance/${id}`);
  return { ok: true };
}

/** Drag-and-drop reschedule: patches only the date. */
export async function moverSesion(id: string, fecha: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return;
  const profile = await currentProfile();
  if (!profile) return;

  const supabase = await createClient();
  const { data: s } = await supabase
    .from("sesiones")
    .select("categoria_id, equipo_id")
    .eq("id", id)
    .maybeSingle();
  if (!s) return;
  const allowed = await canManageSession(
    { categoriaId: s.categoria_id, equipoId: s.equipo_id },
    profile,
  );
  if (!allowed) return;

  await supabase.from("sesiones").update({ fecha }).eq("id", id);
  revalidatePath("/attendance");
}

const SESSION_STATES = [
  "programada",
  "realizada",
  "suspendida",
  "cancelada",
] as const;

/** Plain action: change status (close / suspend / cancel / reopen). */
export async function cambiarEstadoSesion(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("estado") ?? "");
  const estado = SESSION_STATES.find((s) => s === raw);
  if (!id || !estado) return;

  const profile = await currentProfile();
  if (!profile) return;

  const supabase = await createClient();
  const { data: s } = await supabase
    .from("sesiones")
    .select("categoria_id, equipo_id")
    .eq("id", id)
    .maybeSingle();
  if (!s) return;
  const allowed = await canManageSession(
    { categoriaId: s.categoria_id, equipoId: s.equipo_id },
    profile,
  );
  if (!allowed) return;

  await supabase.from("sesiones").update({ estado }).eq("id", id);
  revalidatePath("/attendance");
  revalidatePath(`/attendance/${id}`);
}

export async function eliminarSesion(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const profile = await currentProfile();
  if (!profile) return;

  const supabase = await createClient();
  const { data: s } = await supabase
    .from("sesiones")
    .select("categoria_id, equipo_id")
    .eq("id", id)
    .maybeSingle();
  if (!s) return;
  const allowed = await canManageSession(
    { categoriaId: s.categoria_id, equipoId: s.equipo_id },
    profile,
  );
  if (!allowed) return;

  await supabase.from("sesiones").delete().eq("id", id);
  revalidatePath("/attendance");
}

/**
 * Fills a date range with training sessions from each category's weekly
 * schedule (`categorias.dias_entreno` / `hora_entreno`) — the "at least 2 a
 * week" pattern lives on the category, this just stamps it onto the
 * calendar. Skips dates that already have a training for that category.
 */
export async function generarSesiones(
  _prev: SessionState,
  formData: FormData,
): Promise<SessionState> {
  const ta = await getTranslations("attendance");
  const profile = await currentProfile();
  if (!profile) return { error: ta("noPermission") };

  const parsed = generateSchema.safeParse({
    categoria_ids: formData.getAll("categoria_ids"),
    fecha_inicio: formData.get("fecha_inicio"),
    fecha_fin: formData.get("fecha_fin"),
  });
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const season = await activeSeason();
  if (!season) return { error: ta("noSeason") };

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categorias")
    .select("id, academia_id, dias_entreno, hora_entreno, lugar_entreno")
    .in("id", parsed.data.categoria_ids);

  const allowed: NonNullable<typeof categories> = [];
  for (const cat of categories ?? []) {
    if (isAdmin(profile.rol) || (await canManageCategory(cat.id, profile))) {
      allowed.push(cat);
    }
  }
  if (!allowed.length) return { error: ta("noPermission") };

  const { data: existing } = await supabase
    .from("sesiones")
    .select("categoria_id, fecha")
    .in(
      "categoria_id",
      allowed.map((c) => c.id),
    )
    .eq("tipo", "entrenamiento")
    .gte("fecha", parsed.data.fecha_inicio)
    .lte("fecha", parsed.data.fecha_fin);
  const existingSet = new Set(
    (existing ?? []).map((e) => `${e.categoria_id}|${e.fecha}`),
  );

  const rows: {
    academia_id: string;
    temporada_id: string;
    categoria_id: string;
    equipo_id: null;
    tipo: "entrenamiento";
    fecha: string;
    hora_inicio: string | null;
    hora_fin: string | null;
    lugar: string | null;
    registrada_por: string;
  }[] = [];

  const start = new Date(`${parsed.data.fecha_inicio}T00:00:00`);
  const end = new Date(`${parsed.data.fecha_fin}T00:00:00`);
  const WEEKDAYS = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
    "domingo",
  ] as const;

  for (const cat of allowed) {
    const days = new Set(cat.dias_entreno ?? []);
    if (!days.size) continue;

    for (
      const cursor = new Date(start);
      cursor <= end;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const weekday = WEEKDAYS[(cursor.getDay() + 6) % 7];
      if (!days.has(weekday)) continue;

      const fecha = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      if (existingSet.has(`${cat.id}|${fecha}`)) continue;

      rows.push({
        academia_id: cat.academia_id,
        temporada_id: season.id,
        categoria_id: cat.id,
        equipo_id: null,
        tipo: "entrenamiento",
        fecha,
        hora_inicio: cat.hora_entreno,
        hora_fin: addMinutes(cat.hora_entreno, 90),
        lugar: cat.lugar_entreno,
        registrada_por: profile.id,
      });
    }
  }

  if (!rows.length) return { ok: true, count: 0 };

  const { error } = await supabase.from("sesiones").insert(rows);
  if (error) return { error: await errorMessage(error) };

  revalidatePath("/attendance");
  return { ok: true, count: rows.length };
}

export type AttendanceMarkInput = {
  jugadorId: string;
  estado: AttendanceState;
  minutosJugados?: number | null;
  goles?: number;
  asistenciasGol?: number;
};

/**
 * Bulk-saves a session's roster in one round trip — called directly from the
 * client (not a `<form>`, the marks live in local state as the coach taps
 * through the roster). Upserts one `asistencias` row per player.
 */
export async function registrarAsistencia(
  sessionId: string,
  marks: AttendanceMarkInput[],
): Promise<{ ok: true } | { error: string }> {
  const ta = await getTranslations("attendance");
  const profile = await currentProfile();
  if (!profile) return { error: ta("noPermission") };

  const supabase = await createClient();
  const { data: s } = await supabase
    .from("sesiones")
    .select("categoria_id, equipo_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!s) return { error: ta("noPermission") };

  const allowed = await canManageSession(
    { categoriaId: s.categoria_id, equipoId: s.equipo_id },
    profile,
  );
  if (!allowed) return { error: ta("noPermission") };

  const rows = marks
    .filter((m) => ATTENDANCE_STATES.includes(m.estado))
    .map((m) => ({
      sesion_id: sessionId,
      jugador_id: m.jugadorId,
      estado: m.estado,
      minutos_jugados: m.minutosJugados ?? null,
      goles: m.goles ?? 0,
      asistencias_gol: m.asistenciasGol ?? 0,
      registrada_por: profile.id,
    }));
  if (!rows.length) return { ok: true };

  const { error } = await supabase
    .from("asistencias")
    .upsert(rows, { onConflict: "sesion_id,jugador_id" });
  if (error) return { error: await errorMessage(error) };

  revalidatePath(`/attendance/${sessionId}`);
  revalidatePath("/attendance");
  return { ok: true };
}
