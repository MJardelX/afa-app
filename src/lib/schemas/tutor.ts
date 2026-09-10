import { z } from "zod";

/** Messages are plain keys under the `forms` namespace; the action translates. */

const trimmed = z.string().trim();
const optional = trimmed
  .max(200, "tooLong")
  .optional()
  .transform((v) => (v ? v : null));

export const RELATIONSHIPS = ["padre", "madre", "encargado", "otro"] as const;
export const relationshipSchema = z.enum(RELATIONSHIPS);

export const tutorSchema = z.object({
  nombres: trimmed.min(2, "tooShort").max(120, "tooLong"),
  apellidos: trimmed.min(2, "tooShort").max(120, "tooLong"),
  dpi: optional,
  telefono: optional,
  telefono_alt: optional,
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine(
      (v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "invalidEmail",
    ),
  ocupacion: optional,
  lugar_trabajo: optional,
  direccion: optional,
});

export type TutorInput = z.infer<typeof tutorSchema>;

/**
 * The primary guardian captured inline on the player create form. Required —
 * a minor needs a responsible adult on file. The DPI is the key: if it already
 * matches a tutor the form links to it and skips the name fields.
 */
export const guardianSchema = z.object({
  g_tutor_id: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  g_dpi: trimmed.min(5, "required").max(30, "tooLong"),
  g_parentesco: relationshipSchema.default("encargado"),
  g_nombres: trimmed.max(120, "tooLong").optional().transform((v) => v ?? ""),
  g_apellidos: trimmed.max(120, "tooLong").optional().transform((v) => v ?? ""),
  g_telefono: optional,
  g_email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
});
