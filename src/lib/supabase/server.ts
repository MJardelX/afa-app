import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 * Lee la sesión de las cookies, así que RLS aplica con el usuario real.
 */
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Los Server Components no pueden escribir cookies; el middleware
            // ya refrescó la sesión. Ignorar es el comportamiento correcto.
          }
        },
      },
    },
  );
}
