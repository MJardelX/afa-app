"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { errorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { currentProfile } from "@/server/players";
import { canEvaluatePlayer } from "@/server/evaluation";

export type EvalState = { ok?: boolean; error?: string } | null;

export type ScoreInput = { criterioId: string; puntaje: number };

async function requireEvaluator(jugadorId: string) {
  const te = await getTranslations("evaluation");
  const profile = await currentProfile();
  if (!profile) return { error: te("noPermission") } as const;
  const allowed = await canEvaluatePlayer(jugadorId, profile);
  if (!allowed) return { error: te("noPermission") } as const;
  return { profile } as const;
}

/** Upserts the draft evaluation and its scores. Refuses to touch a finalized one. */
export async function guardarBorrador(
  jugadorId: string,
  periodoId: string,
  scores: ScoreInput[],
  comentarioGeneral: string | null,
): Promise<EvalState> {
  const check = await requireEvaluator(jugadorId);
  if ("error" in check) return check;
  const { profile } = check;
  const te = await getTranslations("evaluation");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("evaluaciones")
    .select("estado")
    .eq("jugador_id", jugadorId)
    .eq("periodo_id", periodoId)
    .eq("evaluador_id", profile.id)
    .maybeSingle();
  if (existing?.estado === "finalizada") return { error: te("alreadyFinalized") };

  const { data: ev, error: evErr } = await supabase
    .from("evaluaciones")
    .upsert(
      {
        jugador_id: jugadorId,
        periodo_id: periodoId,
        evaluador_id: profile.id,
        comentario_general: comentarioGeneral,
        estado: "borrador",
      },
      { onConflict: "jugador_id,periodo_id,evaluador_id" },
    )
    .select("id")
    .single();
  if (evErr || !ev) return { error: await errorMessage(evErr) };

  if (scores.length) {
    const rows = scores.map((s) => ({
      evaluacion_id: ev.id,
      criterio_id: s.criterioId,
      puntaje: s.puntaje,
    }));
    const { error: detErr } = await supabase
      .from("evaluacion_detalle")
      .upsert(rows, { onConflict: "evaluacion_id,criterio_id" });
    if (detErr) return { error: await errorMessage(detErr) };
  }

  revalidatePath("/assessment");
  return { ok: true };
}

/** Locks a draft evaluation so it counts toward the player's averages. */
export async function finalizarEvaluacion(
  jugadorId: string,
  periodoId: string,
): Promise<EvalState> {
  const check = await requireEvaluator(jugadorId);
  if ("error" in check) return check;
  const { profile } = check;
  const te = await getTranslations("evaluation");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evaluaciones")
    .update({ estado: "finalizada" })
    .eq("jugador_id", jugadorId)
    .eq("periodo_id", periodoId)
    .eq("evaluador_id", profile.id)
    .eq("estado", "borrador")
    .select("id")
    .maybeSingle();
  if (error) return { error: await errorMessage(error) };
  if (!data) return { error: te("nothingToFinalize") };

  revalidatePath("/assessment");
  return { ok: true };
}

/** Unlocks a finalized evaluation for further edits. */
export async function reabrirEvaluacion(
  jugadorId: string,
  periodoId: string,
): Promise<EvalState> {
  const check = await requireEvaluator(jugadorId);
  if ("error" in check) return check;
  const { profile } = check;

  const supabase = await createClient();
  const { error } = await supabase
    .from("evaluaciones")
    .update({ estado: "borrador" })
    .eq("jugador_id", jugadorId)
    .eq("periodo_id", periodoId)
    .eq("evaluador_id", profile.id);
  if (error) return { error: await errorMessage(error) };

  revalidatePath("/assessment");
  return { ok: true };
}
