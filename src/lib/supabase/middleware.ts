import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { ipFromRequest } from "@/lib/request-ip";
import { rateLimit } from "@/lib/rate-limit";
import type { Database } from "@/types/database";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy. Production is strict: scripts run only with the
 * per-request nonce (plus `strict-dynamic` so Next's own loader chain is
 * trusted). `style-src` keeps `unsafe-inline` — `next/font` and the inline
 * `style={{}}` category colours need it, and inline styles are a much smaller
 * XSS risk than scripts. Dev loosens `script-src` for Turbopack/React Refresh.
 */
function contentSecurityPolicy(nonce: string): string {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'unsafe-inline' 'unsafe-eval'`;

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self' ${supabase}`.trim(),
    `frame-src 'none'`,
    `frame-ancestors 'none'`,
    `base-uri 'none'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    isProd ? `upgrade-insecure-requests` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/** Refreshes the session token, guards private routes, and sets the CSP. */
export async function updateSession(request: NextRequest) {
  // 1. Coarse per-IP flood guard, before the getUser() call that fans out to
  //    Supabase. In-memory / per-instance — a speed bump, not DDoS protection.
  const ip = ipFromRequest(request);
  const flood = rateLimit(`req:${ip}`, 300, 60_000);
  if (!flood.ok) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(flood.retryAfter) },
    });
  }

  // 2. Per-request nonce. Next reads it from the request's CSP header and
  //    stamps its own <script> tags; our boot script reads x-nonce.
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);

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
          response = NextResponse.next({ request: { headers: requestHeaders } });
          response.headers.set("content-security-policy", csp);
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
        { status: 401, headers: { "content-security-policy": csp } },
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("content-security-policy", csp);
    return redirect;
  }

  return response;
}
