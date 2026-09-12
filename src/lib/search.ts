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
