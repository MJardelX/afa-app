import { NextResponse } from "next/server";

import { crear, listar } from "@/server/items-repo";
import type { ApiResponse, Item } from "@/types";

export async function GET(): Promise<NextResponse<ApiResponse<Item[]>>> {
  return NextResponse.json({ ok: true, data: listar() });
}

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse<Item>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "El cuerpo debe ser JSON válido" },
      { status: 400 },
    );
  }

  const nombre =
    typeof body === "object" && body !== null && "nombre" in body
      ? String((body as { nombre: unknown }).nombre).trim()
      : "";

  if (!nombre) {
    return NextResponse.json(
      { ok: false, error: "El campo 'nombre' es obligatorio" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: crear(nombre) }, { status: 201 });
}
