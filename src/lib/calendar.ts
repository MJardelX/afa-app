/**
 * Small month-grid helpers for the attendance calendar. Pure and
 * timezone-safe: every date is built from local y/m/d components, never
 * parsed from an ISO string, so there's no UTC/local rounding to worry about.
 */

export type YearMonth = { year: number; month0: number };

const MONTH_RE = /^(\d{4})-(\d{2})$/;

/** Parses `?month=YYYY-MM`, falling back to the current month. */
export function parseMonthParam(value: string | undefined): YearMonth {
  const m = value ? MONTH_RE.exec(value) : null;
  if (m) {
    const year = Number(m[1]);
    const month0 = Number(m[2]) - 1;
    if (month0 >= 0 && month0 <= 11) return { year, month0 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month0: now.getMonth() };
}

export function monthParam({ year, month0 }: YearMonth): string {
  return `${year}-${String(month0 + 1).padStart(2, "0")}`;
}

export function shiftMonth({ year, month0 }: YearMonth, delta: number): YearMonth {
  const d = new Date(year, month0 + delta, 1);
  return { year: d.getFullYear(), month0: d.getMonth() };
}

/** First/last ISO date of a `YYYY-MM` value (as typed by `<input type="month">`). */
export function monthBounds(value: string): { start: string; end: string } {
  const { year, month0 } = parseMonthParam(value);
  return {
    start: toISODate(new Date(year, month0, 1)),
    end: toISODate(new Date(year, month0 + 1, 0)),
  };
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Full weeks (Monday first) covering every day of the target month. */
export function monthGrid({ year, month0 }: YearMonth): Date[][] {
  const first = new Date(year, month0, 1);
  const last = new Date(year, month0 + 1, 0);
  const startOffset = (first.getDay() + 6) % 7;
  const endOffset = (7 - ((last.getDay() + 6) % 7) - 1) % 7;
  const gridStart = new Date(year, month0, 1 - startOffset);
  const gridEnd = new Date(year, month0, last.getDate() + endOffset);

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}
