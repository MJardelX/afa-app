export const PAGE_SIZE = 15;

/** 1-based page from a search param, clamped to >= 1. */
export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/** Inclusive [from, to] for Supabase `.range()`. */
export function rangeFor(page: number, size = PAGE_SIZE): [number, number] {
  const from = (page - 1) * size;
  return [from, from + size - 1];
}
