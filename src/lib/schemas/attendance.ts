import { z } from "zod";

/**
 * Messages are plain keys under the `forms` namespace; the action translates.
 *
 * Trainings belong to a CATEGORY — every team in it trains together — so
 * `categoria_id` is required and `equipo_id` stays empty. Matches (and
 * friendlies/tournaments) belong to a specific TEAM (rival, squad, score),
 * so it's the other way around.
 */

export const SESSION_TYPES = [
  "entrenamiento",
  "partido",
  "amistoso",
  "torneo",
] as const;

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .optional()
    .transform((v) => (v ? v : null));

const optionalTime = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

export const sessionSchema = z
  .object({
    tipo: z.enum(SESSION_TYPES),
    categoria_id: optionalId,
    equipo_id: optionalId,
    fecha: isoDate,
    hora_inicio: optionalTime,
    hora_fin: optionalTime,
    lugar: optionalText(120),
    rival: optionalText(80),
    notas: optionalText(400),
  })
  .superRefine((v, ctx) => {
    if (v.tipo === "entrenamiento") {
      if (!v.categoria_id) {
        ctx.addIssue({ code: "custom", path: ["categoria_id"], message: "required" });
      }
    } else if (!v.equipo_id) {
      ctx.addIssue({ code: "custom", path: ["equipo_id"], message: "required" });
    }
  })
  .transform((v) => ({
    ...v,
    categoria_id: v.tipo === "entrenamiento" ? v.categoria_id : null,
    equipo_id: v.tipo === "entrenamiento" ? null : v.equipo_id,
  }));

export type SessionInput = z.infer<typeof sessionSchema>;

export const generateSchema = z
  .object({
    categoria_ids: z.array(z.string().trim().min(10)).min(1, "required"),
    fecha_inicio: isoDate,
    fecha_fin: isoDate,
  })
  .refine((v) => v.fecha_fin >= v.fecha_inicio, {
    path: ["fecha_fin"],
    message: "endBeforeStart",
  });

export type GenerateInput = z.infer<typeof generateSchema>;
