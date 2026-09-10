import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/** Refreshes the session token on every request and guards private routes. */
export async function updateSession(request: NextRequest) {
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

  // getUser() validates the token against Supabase. Do not use getSession()
  // here: it reads the cookie without verifying it, and on the server that is
  // not trustworthy.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname === "/api/health";

  if (!user && !isPublicRoute) {
    // API routes answer 401 in JSON. Redirecting them to /login would return
    // HTML to a fetch(), which is impossible to handle on the client.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
