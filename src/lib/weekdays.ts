/** Shared weekday vocabulary — training schedules (categories) and their
 *  generated sessions all key off these Spanish day names. */

export const WEEKDAYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/** Message key under `common` for each day's short label ("Mon", "Lun"...). */
export const WEEKDAY_LABEL_KEY: Record<string, string> = {
  lunes: "weekMon",
  martes: "weekTue",
  miercoles: "weekWed",
  jueves: "weekThu",
  viernes: "weekFri",
  sabado: "weekSat",
  domingo: "weekSun",
};
