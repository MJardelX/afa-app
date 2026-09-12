/**
 * Small formatting helpers. The age functions mirror the SQL functions
 * `edad_real` / `edad_deportiva` so the player form can preview the derived
 * category client-side (see the data model section of the README).
 */

export function fullName(p: {
  nombres?: string | null;
  apellidos?: string | null;
}) {
  return [p.nombres, p.apellidos].filter(Boolean).join(" ").trim();
}

/** Real age, from the birthday. */
export function realAge(birth: string | Date): number {
  const b = new Date(birth);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

/** Sporting age: years reached DURING the season year (by birth year). */
export function sportingAge(birth: string | Date, seasonYear: number): number {
  return seasonYear - new Date(birth).getFullYear();
}

type Category = { id: string; nombre: string; edad_min: number; edad_max: number };

/** The category a sporting age falls into, or null. */
export function categoryForAge(
  sporting: number,
  categories: Category[],
): Category | null {
  return (
    categories.find((c) => sporting >= c.edad_min && sporting <= c.edad_max) ??
    null
  );
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
): string {
  if (!value) return "—";
  // Postgres `date` columns arrive as "YYYY-MM-DD" — parsed as UTC midnight, so
  // format in UTC too or a negative-offset timezone shifts it a day back.
  const dateOnly =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  }).format(new Date(value));
}
