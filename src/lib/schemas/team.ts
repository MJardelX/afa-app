import { z } from "zod";

/** Messages are plain keys under the `forms` namespace; the action translates. */

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 10 ? v : null));

export const teamSchema = z.object({
  categoria_id: z.string().trim().min(10, "required"),
  nombre: z.string().trim().min(1, "required").max(80, "tooLong"),
  entrenador_id: optionalUuid,
  auxiliar_id: optionalUuid,
  activo: z
    .union([z.literal("on"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
});

export type TeamInput = z.infer<typeof teamSchema>;

/** Enrolling / transferring a player into a team. */
export const enrollmentSchema = z.object({
  jugador_id: z.string().trim().min(10, "required"),
  numero_camiseta: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length ? Number(v) : null))
    .refine(
      (v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 99),
      "outOfRange",
    ),
  posicion: z
    .string()
    .trim()
    .max(40, "tooLong")
    .optional()
    .transform((v) => (v ? v : null)),
});

export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
