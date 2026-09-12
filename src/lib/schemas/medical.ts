import { z } from "zod";

/**
 * Medical record — kept intentionally small: not every family provides full
 * details, so only the fields a coach or first responder actually needs.
 * (The `fichas_medicas` table has more columns; they stay dormant for now.)
 * Messages are plain keys under the `forms` namespace; the action translates.
 */

const longText = z
  .string()
  .trim()
  .max(2000, "tooLong")
  .optional()
  .transform((v) => (v ? v : null));

export const medicalSchema = z.object({
  alergias: longText,
  enfermedades: longText,
  medicamentos: longText,
  observaciones: longText,
});

export type MedicalInput = z.infer<typeof medicalSchema>;
