import type { Item } from "@/types";

/**
 * Almacén en memoria: sustituye este módulo por Prisma / Drizzle / Supabase
 * sin tocar las rutas de `/api`.
 */
const items = new Map<string, Item>();

export function listar(): Item[] {
  return [...items.values()].sort((a, b) =>
    a.creadoEn.localeCompare(b.creadoEn),
  );
}

export function obtener(id: string): Item | undefined {
  return items.get(id);
}

export function crear(nombre: string): Item {
  const item: Item = {
    id: crypto.randomUUID(),
    nombre,
    creadoEn: new Date().toISOString(),
  };
  items.set(item.id, item);
  return item;
}

export function eliminar(id: string): boolean {
  return items.delete(id);
}
