import { z } from "zod";

import { WEEKDAYS } from "@/lib/weekdays";

/** Messages are plain keys under the `forms` namespace; the action translates. */

const name = z.string().trim().min(2, "tooShort").max(80, "tooLong");
const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate");
const orden = z.coerce.number().int("invalidNumber").min(0, "outOfRange").max(999);
const checkbox = z
  .union([z.literal("on"), z.literal("")])
  .optional()
  .transform((v) => v === "on");
const optionalUuid = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 10 ? v : null));

// ── Categories ─────────────────────────────────────────────────────────────

export const categorySchema = z
  .object({
    nombre: name,
    edad_min: z.coerce.number().int("invalidNumber").min(3, "outOfRange").max(99),
    edad_max: z.coerce.number().int("invalidNumber").min(3, "outOfRange").max(99),
    orden,
    color: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/, "invalidColor")
      .optional()
      .transform((v) => v ?? "#0ea5e9"),
    dias_entreno: z
      .array(z.enum(WEEKDAYS))
      .optional()
      .transform((v) => (v && v.length ? v : null)),
    hora_entreno: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : null)),
    lugar_entreno: z
      .string()
      .trim()
      .max(120, "tooLong")
      .optional()
      .transform((v) => (v ? v : null)),
    entrenador_id: optionalUuid,
    auxiliar_id: optionalUuid,
    activa: checkbox,
  })
  .refine((v) => v.edad_max >= v.edad_min, {
    path: ["edad_max"],
    message: "endBeforeStart",
  });

export type CategoryInput = z.infer<typeof categorySchema>;

// ── Temporadas ─────────────────────────────────────────────────────────────

export const seasonSchema = z
  .object({
    nombre: name,
    anio: z.coerce.number().int("invalidNumber").min(2000, "outOfRange").max(2100),
    fecha_inicio: isoDate,
    fecha_fin: isoDate,
    activa: checkbox,
    cerrada: checkbox,
  })
  .refine((v) => v.fecha_fin > v.fecha_inicio, {
    path: ["fecha_fin"],
    message: "endBeforeStart",
  });

export type SeasonInput = z.infer<typeof seasonSchema>;

// ── Assessment periods ─────────────────────────────────────────────────────

export const periodSchema = z
  .object({
    temporada_id: z.string().trim().min(10, "required"),
    nombre: name,
    fecha_inicio: isoDate,
    fecha_fin: isoDate,
    orden,
  })
  .refine((v) => v.fecha_fin > v.fecha_inicio, {
    path: ["fecha_fin"],
    message: "endBeforeStart",
  });

export type PeriodInput = z.infer<typeof periodSchema>;

// ── Assessment criteria ────────────────────────────────────────────────────

export const DIMENSIONS = [
  "tecnica",
  "tactica",
  "fisica",
  "actitudinal",
] as const;

const anchor = z
  .string()
  .trim()
  .max(240, "tooLong")
  .optional()
  .transform((v) => (v ? v : null));

export const criterionSchema = z.object({
  dimension: z.enum(DIMENSIONS),
  nombre: name,
  descripcion: z
    .string()
    .trim()
    .max(400, "tooLong")
    .optional()
    .transform((v) => (v ? v : null)),
  peso: z.coerce.number().gt(0, "invalidNumber").max(9.99),
  escala_max: z.coerce
    .number()
    .int("invalidNumber")
    .min(3, "outOfRange")
    .max(10, "outOfRange"),
  orden,
  activo: checkbox,
  // Rubric anchors: low / mid / high. Keyed by score in the action.
  rubrica_min: anchor,
  rubrica_mid: anchor,
  rubrica_max: anchor,
});

export type CriterionInput = z.infer<typeof criterionSchema>;
