/**
 * Sanitises a free-text search term before it goes into a PostgREST `or()`
 * filter (`col.ilike.%term%`). Strips the characters that could break out of
 * the filter grammar (`,` splits conditions, `()` group, `%`/`*` are wildcards,
 * `:` is used in some operators), collapses whitespace, and caps the length so
 * a huge payload can't turn into an expensive query.
 */
export function sanitizeSearch(raw: string | null | undefined): string {
  return (raw ?? "")
    .replace(/[%,()*:]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Lower-case, accent-free, single-spaced — mirrors the DB's `normalizar_texto`
 * so "José  Xiquita" and "jose xiquita" compare equal. NFD splits "é" into
 * "e" + a combining mark, which is then dropped (also "ñ" -> "n", like
 * unaccent does).
 */
export function normalizeText(raw: string | null | undefined): string {
  return (raw ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * PostgREST `or()` filter for a name search that ignores accents and case and
 * matches each word anywhere in the name, so "jose xiquita" finds "José
 * Andrés Xiquita". `nameColumn` must hold `normalizar_texto(...)` output;
 * `otherColumns` (codes, phone numbers…) are matched on the raw term.
 */
export function nameSearchFilter(
  raw: string | null | undefined,
  nameColumn: string,
  otherColumns: string[] = [],
): string | null {
  const term = sanitizeSearch(raw);
  const words = normalizeText(term).split(" ").filter(Boolean);
  if (!words.length) return null;
  const name = words.map((w) => `${nameColumn}.ilike.%${w}%`).join(",");
  return [`and(${name})`, ...otherColumns.map((c) => `${c}.ilike.%${term}%`)].join(",");
}
