import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types";

type Health = { status: "ok"; timestamp: string };

// The only cross-origin-accessible route: a health probe with no sensitive
// data. Everything else is same-origin only (and gated by auth + RLS).
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store",
};

export async function GET(): Promise<NextResponse<ApiResponse<Health>>> {
  return NextResponse.json(
    { ok: true, data: { status: "ok", timestamp: new Date().toISOString() } },
    { headers: CORS },
  );
}

export function OPTIONS(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS });
}
