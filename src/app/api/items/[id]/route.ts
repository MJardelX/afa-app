import { NextResponse } from "next/server";

import { eliminar, obtener } from "@/server/items-repo";
import type { ApiResponse, Item } from "@/types";

/** En App Router los params llegan como Promise; hay que await-earlos. */
type Contexto = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  { params }: Contexto,
): Promise<NextResponse<ApiResponse<Item>>> {
  const { id } = await params;
  const item = obtener(id);

  if (!item) {
    return NextResponse.json(
      { ok: false, error: "No encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, data: item });
}

export async function DELETE(
  _request: Request,
  { params }: Contexto,
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  const { id } = await params;

  if (!eliminar(id)) {
    return NextResponse.json(
      { ok: false, error: "No encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, data: { id } });
}
