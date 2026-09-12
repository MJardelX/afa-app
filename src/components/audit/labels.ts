/**
 * Audit vocabulary shared between the client filter and the server list —
 * kept out of `server/audit.ts` on purpose: that module imports the server
 * Supabase client (`next/headers`), so a client component can't import even
 * its plain constants without pulling that in too.
 */

export const AUDIT_TABLES = [
  "jugadores",
  "fichas_medicas",
  "inscripciones",
  "tutores",
  "equipos",
  "temporadas",
  "evaluaciones",
  "perfiles",
] as const;

export const AUDIT_ACTIONS = ["INSERT", "UPDATE", "DELETE"] as const;

/** Message keys under the `audit` namespace for each audited table / action. */

export const TABLE_KEY: Record<string, string> = {
  jugadores: "tablePlayers",
  fichas_medicas: "tableMedical",
  inscripciones: "tableEnrollments",
  tutores: "tableGuardians",
  equipos: "tableTeams",
  temporadas: "tableSeasons",
  evaluaciones: "tableEvaluations",
  perfiles: "tableProfiles",
};

export const ACTION_KEY: Record<string, string> = {
  INSERT: "actionInsert",
  UPDATE: "actionUpdate",
  DELETE: "actionDelete",
};
