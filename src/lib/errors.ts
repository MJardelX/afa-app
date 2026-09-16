import { getTranslations } from "next-intl/server";

/**
 * Maps a Postgres / PostgREST error to a friendly, translated message.
 *
 * RLS and the schema constraints are the real guardrails; when they fire, the
 * raw message ("duplicate key value violates unique constraint …") is useless
 * to the user. This turns the common ones into something readable.
 */
type DbError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

/** Constraint name (or trigger message fragment) -> key under `errors`. */
const BY_CONSTRAINT: Record<string, string> = {
  equipos_temporada_id_nombre_key: "teamNameTaken",
  inscripcion_camiseta_unica: "shirtTaken",
  inscripcion_principal_unica: "primaryTeamExists",
  jugador_contacto_principal_unico: "primaryContactExists",
  temporada_activa_unica: "activeSeasonExists",
  categorias_sin_traslape: "categoryOverlap",
  categoria_rango_valido: "categoryRange",
  inscripcion_camiseta_valida: "shirtRange",
  jugador_nacimiento_valido: "birthdateInvalid",
  temporada_fechas_validas: "seasonDates",
  periodo_fechas_validas: "periodDates",
};

const BY_CODE: Record<string, string> = {
  "23505": "duplicate",
  "23503": "referenced",
  "23514": "checkFailed",
  "23P01": "overlap",
  "42501": "forbidden",
  P0001: "ruleViolation",
};

export async function errorMessage(err: unknown): Promise<string> {
  const t = await getTranslations("errors");
  const e = (err ?? {}) as DbError;
  const haystack = `${e.message ?? ""} ${e.details ?? ""}`.toLowerCase();

  for (const [name, key] of Object.entries(BY_CONSTRAINT)) {
    if (haystack.includes(name)) return t(key);
  }
  if (e.code && BY_CODE[e.code]) return t(BY_CODE[e.code]);
  // Matches the Spanish text raised by fn_validar_asistencia (DB messages
  // stay Spanish — data-layer contract).
  if (haystack.includes("no está inscrito")) return t("notEnrolled");
  // Matches fn_validar_equipo_categoria: team below the player's real category.
  if (haystack.includes("solo puede subir de categoría")) return t("teamBelowAge");

  return t("generic");
}
