import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/** Refresca el token de sesión en cada petición y protege las rutas privadas. */
export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() valida el token contra Supabase. No usar getSession() aquí:
  // lee la cookie sin verificarla, y en el servidor eso no es confiable.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const esRutaPublica =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname === "/api/health";

  if (!user && !esRutaPublica) {
    // Las rutas de API responden 401 en JSON. Redirigirlas a /login le
    // devolvería HTML a un fetch(), que es imposible de manejar en el cliente.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
