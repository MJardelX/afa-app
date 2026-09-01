import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types";

type Health = { status: "ok"; timestamp: string };

export async function GET(): Promise<NextResponse<ApiResponse<Health>>> {
  return NextResponse.json({
    ok: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
}
