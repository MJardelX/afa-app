import { z } from "zod";

/** Messages are plain keys under the `forms` namespace; the action translates. */

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "required"),
    // Mirrors `minimum_password_length` in supabase/config.toml.
    new_password: z.string().min(8, "tooShort").max(72, "tooLong"),
    confirm_password: z.string().min(1, "required"),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ["confirm_password"],
    message: "passwordMismatch",
  })
  .refine((v) => v.new_password !== v.current_password, {
    path: ["new_password"],
    message: "samePassword",
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
