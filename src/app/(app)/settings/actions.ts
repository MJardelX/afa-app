"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { errorMessage } from "@/lib/errors";
import {
  categorySchema,
  criterionSchema,
  periodSchema,
  seasonSchema,
} from "@/lib/schemas/settings";
import { createClient } from "@/lib/supabase/server";
import { currentProfile, isAdmin } from "@/server/players";

export type SettingsState = {
  ok?: boolean;
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

function reviveSettings() {
  revalidatePath("/settings");
}

// ── Categories ─────────────────────────────────────────────────────────────

function readCategory(formData: FormData) {
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  raw.dias_entreno = formData.getAll("dias_entreno");
  return raw;
}

export async function crearCategoria(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ts = await getTranslations("settings");
  const profile = await requireAdmin();
  if (!profile) return { error: ts("adminOnly") };

  const parsed = categorySchema.safeParse(readCategory(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias")
    .insert({ academia_id: profile.academia_id, ...parsed.data });
  if (error) return { error: await errorMessage(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function actualizarCategoria(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ts = await getTranslations("settings");
  const profile = await requireAdmin();
  if (!profile) return { error: ts("adminOnly") };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: ts("adminOnly") };

  const parsed = categorySchema.safeParse(readCategory(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: await errorMessage(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function cambiarEstadoCategoria(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;
  const id = String(formData.get("id") ?? "");
  const activa = formData.get("activa") === "true";
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias")
    .update({ activa })
    .eq("id", id);
  if (error) return;
  revalidatePath("/", "layout");
}

export async function eliminarCategoria(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ts = await getTranslations("settings");
  const profile = await requireAdmin();
  if (!profile) return { error: ts("adminOnly") };
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: ts("adminOnly") };

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) {
    return {
      error:
        error.code === "23503"
          ? ts("catDeleteBlocked")
          : await errorMessage(error),
    };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Temporadas ─────────────────────────────────────────────────────────────

export async function crearTemporada(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ts = await getTranslations("settings");
  const profile = await requireAdmin();
  if (!profile) return { error: ts("adminOnly") };

  const parsed = seasonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { activa, ...rest } = parsed.data;

  if (activa) {
    await supabase
      .from("temporadas")
      .update({ activa: false })
      .eq("activa", true);
  }

  const { error } = await supabase
    .from("temporadas")
    .insert({ academia_id: profile.academia_id, activa, ...rest });
  if (error) return { error: await errorMessage(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function actualizarTemporada(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ts = await getTranslations("settings");
  const profile = await requireAdmin();
  if (!profile) return { error: ts("adminOnly") };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: ts("adminOnly") };

  const parsed = seasonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { activa, ...rest } = parsed.data;

  if (activa) {
    await supabase
      .from("temporadas")
      .update({ activa: false })
      .eq("activa", true)
      .neq("id", id);
  }

  const { error } = await supabase
    .from("temporadas")
    .update({ activa, ...rest })
    .eq("id", id);
  if (error) return { error: await errorMessage(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Plain action: make this the single active season. */
export async function activarTemporada(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("temporadas")
    .update({ activa: false })
    .eq("activa", true)
    .neq("id", id);
  await supabase.from("temporadas").update({ activa: true }).eq("id", id);
  revalidatePath("/", "layout");
}

/** Plain action: toggle the closed flag. */
export async function alternarCierreTemporada(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;
  const id = String(formData.get("id") ?? "");
  const cerrada = formData.get("cerrada") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("temporadas").update({ cerrada }).eq("id", id);
  revalidatePath("/", "layout");
}

// ── Assessment periods ─────────────────────────────────────────────────────

export async function crearPeriodo(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ts = await getTranslations("settings");
  const profile = await requireAdmin();
  if (!profile) return { error: ts("adminOnly") };

  const parsed = periodSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("periodos_evaluacion")
    .insert(parsed.data);
  if (error) return { error: await errorMessage(error) };

  reviveSettings();
  return { ok: true };
}

export async function actualizarPeriodo(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ts = await getTranslations("settings");
  const profile = await requireAdmin();
  if (!profile) return { error: ts("adminOnly") };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: ts("adminOnly") };

  const parsed = periodSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("periodos_evaluacion")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: await errorMessage(error) };

  reviveSettings();
  return { ok: true };
}

export async function alternarCierrePeriodo(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;
  const id = String(formData.get("id") ?? "");
  const cerrado = formData.get("cerrado") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("periodos_evaluacion")
    .update({ cerrado })
    .eq("id", id);
  reviveSettings();
}

export async function eliminarPeriodo(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("periodos_evaluacion").delete().eq("id", id);
  reviveSettings();
}

// ── Assessment criteria ────────────────────────────────────────────────────

function buildRubric(
  v: ReturnType<typeof criterionSchema.parse>,
): Record<string, string> | null {
  const mid = Math.ceil(v.escala_max / 2);
  const entries: [string, string | null][] = [
    ["1", v.rubrica_min],
    [String(mid), v.rubrica_mid],
    [String(v.escala_max), v.rubrica_max],
  ];
  const out: Record<string, string> = {};
  for (const [k, val] of entries) if (val) out[k] = val;
  return Object.keys(out).length ? out : null;
}

function criterionFields(v: ReturnType<typeof criterionSchema.parse>) {
  return {
    dimension: v.dimension,
    nombre: v.nombre,
    descripcion: v.descripcion,
    peso: v.peso,
    escala_max: v.escala_max,
    orden: v.orden,
    activo: v.activo,
    rubrica: buildRubric(v),
  };
}

export async function crearCriterio(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ts = await getTranslations("settings");
  const profile = await requireAdmin();
  if (!profile) return { error: ts("adminOnly") };

  const parsed = criterionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("criterios_evaluacion")
    .insert({ academia_id: profile.academia_id, ...criterionFields(parsed.data) });
  if (error) return { error: await errorMessage(error) };

  reviveSettings();
  return { ok: true };
}

export async function actualizarCriterio(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ts = await getTranslations("settings");
  const profile = await requireAdmin();
  if (!profile) return { error: ts("adminOnly") };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: ts("adminOnly") };

  const parsed = criterionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: await fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("criterios_evaluacion")
    .update(criterionFields(parsed.data))
    .eq("id", id);
  if (error) return { error: await errorMessage(error) };

  reviveSettings();
  return { ok: true };
}

export async function cambiarEstadoCriterio(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;
  const id = String(formData.get("id") ?? "");
  const activo = formData.get("activo") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("criterios_evaluacion").update({ activo }).eq("id", id);
  reviveSettings();
}

export async function eliminarCriterio(formData: FormData) {
  const profile = await requireAdmin();
  if (!profile) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("criterios_evaluacion").delete().eq("id", id);
  reviveSettings();
}
