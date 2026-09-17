import { z } from "zod";

/**
 * Validation for the player form. Messages are plain keys under the `forms`
 * i18n namespace — the Server Action translates them before returning.
 */

const trimmed = z.string().trim();
const optionalText = trimmed
  .max(500, "tooLong")
  .optional()
  .transform((v) => (v ? v : null));

const pastDate = z
  .string()
  .min(1, "required")
  .refine((v) => !Number.isNaN(Date.parse(v)), "invalidDate")
  .refine((v) => new Date(v) <= new Date(), "mustBePast");

export const PLAYER_SEXES = ["masculino", "femenino"] as const;

export const playerSchema = z.object({
  nombres: trimmed.min(2, "tooShort").max(120, "tooLong"),
  apellidos: trimmed.min(2, "tooShort").max(120, "tooLong"),
  fecha_nacimiento: pastDate.refine(
    (v) => new Date(v).getFullYear() > 1990,
    "invalidDate",
  ),
  sexo: z.enum(PLAYER_SEXES),
  lugar_nacimiento: optionalText,
  direccion: optionalText,
  fecha_ingreso: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine(
      (v) => v === null || (!Number.isNaN(Date.parse(v)) && new Date(v) <= new Date()),
      "invalidDate",
    ),
  observaciones: optionalText,
});

export type PlayerInput = z.infer<typeof playerSchema>;

/**
 * Step 4 + 5 of the create wizard: which category the player plays in this
 * season, and (optionally) their team. `es_excepcion` = the coach deliberately
 * chose a category other than the one the player's sporting age lands in, so a
 * reason is required.
 */
export const wizardEnrollmentSchema = z
  .object({
    categoria_final_id: trimmed.min(10, "required"),
    es_excepcion: z
      .union([z.literal("on"), z.literal("")])
      .optional()
      .transform((v) => v === "on"),
    motivo_excepcion: trimmed
      .max(300, "tooLong")
      .optional()
      .transform((v) => (v ? v : null)),
    equipo_id: trimmed
      .optional()
      .transform((v) => (v && v.length > 10 ? v : null)),
    numero_camiseta: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length ? Number(v) : null))
      .refine(
        (v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 99),
        "outOfRange",
      ),
    posicion: trimmed
      .max(40, "tooLong")
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .refine((v) => !v.es_excepcion || !!v.motivo_excepcion, {
    path: ["motivo_excepcion"],
    message: "required",
  });

export type WizardEnrollmentInput = z.infer<typeof wizardEnrollmentSchema>;

export const PLAYER_STATUSES = [
  "activo",
  "inactivo",
  "retirado",
  "egresado",
] as const;

export const statusSchema = z.enum(PLAYER_STATUSES);
