"use client";

import { useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Handshake,
  Plus,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { moverSesion } from "@/app/(app)/attendance/actions";
import { CalendarFilters } from "@/components/attendance/calendar-filters";
import { GenerateSessionsForm } from "@/components/attendance/generate-sessions-form";
import { SessionForm } from "@/components/attendance/session-form";
import type {
  CalendarCategoryOption,
  CalendarCell,
  CalendarSessionItem,
  CalendarTeamOption,
} from "@/components/attendance/types";
import { buttonClasses } from "@/components/ui/button";
import { monthParam, shiftMonth, toISODate, type YearMonth } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, LucideIcon> = {
  entrenamiento: Dumbbell,
  partido: Trophy,
  amistoso: Handshake,
  torneo: Award,
};

/** px of pointer movement before a tap on a session chip becomes a drag. */
const DRAG_THRESHOLD = 6;

/** The mobile day view's visible time window. */
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;
const PX_PER_HOUR = 56;

/**
 * Remembers the mobile week/day toggle across visits (e.g. opening a
 * session's detail page and coming back unmounts this component, so plain
 * useState alone would silently reset to the default every time). Same
 * localStorage + custom-event pattern as the sidebar/theme toggles — a
 * `storage` event alone wouldn't fire in the tab that made the change.
 */
const MOBILE_VIEW_STORAGE_KEY = "afa-attendance-mobile-view";
const MOBILE_VIEW_EVENT = "afa-attendance-mobile-view-change";

function subscribeMobileView(onChange: () => void) {
  window.addEventListener(MOBILE_VIEW_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(MOBILE_VIEW_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readMobileView(): "week" | "day" {
  try {
    return localStorage.getItem(MOBILE_VIEW_STORAGE_KEY) === "week" ? "week" : "day";
  } catch {
    return "day";
  }
}

function readMobileViewOnServer(): "week" | "day" {
  return "day";
}

function writeMobileView(view: "week" | "day") {
  try {
    localStorage.setItem(MOBILE_VIEW_STORAGE_KEY, view);
  } catch {
    // Private browsing / storage disabled — the toggle still works for the
    // rest of this visit, it just won't be remembered next time.
  }
  window.dispatchEvent(new Event(MOBILE_VIEW_EVENT));
}

function sessionLabel(s: CalendarSessionItem) {
  return s.tipo === "entrenamiento" ? s.categoria : (s.equipo ?? s.categoria);
}

/**
 * Remembers which day the mobile week/day view was last showing, for the
 * same reason as the view toggle above — going into a session's detail page
 * and back unmounts this component. Server snapshot is "" (nothing to
 * restore yet), which the component resolves to "today" the same way it
 * already does when nothing is stored — so there's no hydration mismatch.
 */
const LAST_DATE_STORAGE_KEY = "afa-attendance-last-date";
const LAST_DATE_EVENT = "afa-attendance-last-date-change";

function subscribeLastDate(onChange: () => void) {
  window.addEventListener(LAST_DATE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LAST_DATE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readLastDate(): string {
  try {
    return localStorage.getItem(LAST_DATE_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function readLastDateOnServer(): string {
  return "";
}

function writeLastDate(iso: string) {
  try {
    localStorage.setItem(LAST_DATE_STORAGE_KEY, iso);
  } catch {
    // Private browsing / storage disabled — navigation still works for the
    // rest of this visit, it just won't be remembered next time.
  }
  window.dispatchEvent(new Event(LAST_DATE_EVENT));
}

const WEEKDAY_KEYS = [
  "weekMon",
  "weekTue",
  "weekWed",
  "weekThu",
  "weekFri",
  "weekSat",
  "weekSun",
] as const;

export function AttendanceCalendar({
  ym,
  weeks,
  monthLabel,
  sessions,
  categories,
  teams,
  manageableCategoryIds,
  manageableTeamIds,
  categoriaFilter,
  equipoFilter,
}: {
  ym: YearMonth;
  weeks: CalendarCell[][];
  monthLabel: string;
  sessions: CalendarSessionItem[];
  categories: CalendarCategoryOption[];
  teams: CalendarTeamOption[];
  manageableCategoryIds: string[];
  manageableTeamIds: string[];
  categoriaFilter: string;
  equipoFilter: string;
}) {
  const t = useTranslations("attendance");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [panel, setPanel] = useState<"none" | "new" | "generate">("none");
  const [newDate, setNewDate] = useState<string | undefined>(undefined);
  const [, startTransition] = useTransition();

  // ── mobile week/day view — a month grid is too cramped below ~640px, so
  // small screens page one week (or one day) at a time instead. Which one is
  // "current" is derived from a single remembered date rather than a plain
  // index, so it survives leaving for a session's detail page and coming
  // back (see readLastDate/writeLastDate above) — and walking off either end
  // of the loaded month just re-fetches the next/previous one and keeps
  // going, since the target date came along for the ride. ──────────────────
  const mobileView = useSyncExternalStore(
    subscribeMobileView,
    readMobileView,
    readMobileViewOnServer,
  );
  const setMobileView = writeMobileView;

  const lastDateIso = useSyncExternalStore(subscribeLastDate, readLastDate, readLastDateOnServer);
  function findDay(predicate: (c: CalendarCell) => boolean) {
    for (const week of weeks) {
      const day = week.find(predicate);
      if (day) return { currentWeek: week, currentDay: day };
    }
    return null;
  }
  const { currentWeek, currentDay } = findDay((c) => c.iso === lastDateIso) ??
    findDay((c) => c.isToday) ?? { currentWeek: weeks[0], currentDay: weeks[0][0] };

  const weekLabel = useMemo(() => {
    const start = new Date(`${currentWeek[0].iso}T00:00:00`);
    const end = new Date(`${currentWeek[6].iso}T00:00:00`);
    const sameMonth = start.getMonth() === end.getMonth();
    const dayFmt = new Intl.DateTimeFormat(locale, { day: "numeric" });
    const withMonth = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
    return sameMonth
      ? `${dayFmt.format(start)}–${withMonth.format(end)}`
      : `${withMonth.format(start)} – ${withMonth.format(end)}`;
  }, [currentWeek, locale]);
  const dayLabel = useMemo(() => {
    const d = new Date(`${currentDay.iso}T00:00:00`);
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(d);
  }, [currentDay, locale]);

  /** Remembers `iso` as the current day, paging to the next/previous month
   *  first if it falls outside the currently loaded weeks. */
  function goToDate(iso: string) {
    writeLastDate(iso);
    if (iso < weeks[0][0].iso) gotoMonth(-1);
    else if (iso > weeks[weeks.length - 1][6].iso) gotoMonth(1);
  }
  function addDays(iso: string, delta: number) {
    const d = new Date(`${iso}T00:00:00`);
    d.setDate(d.getDate() + delta);
    return toISODate(d);
  }
  function prevDay() {
    goToDate(addDays(currentDay.iso, -1));
  }
  function nextDay() {
    goToDate(addDays(currentDay.iso, 1));
  }
  function prevWeek() {
    goToDate(addDays(currentDay.iso, -7));
  }
  function nextWeek() {
    goToDate(addDays(currentDay.iso, 7));
  }

  // ── drag to reschedule — pointer-based so it works with touch, not just
  // mouse (the old HTML5 `draggable` API never fires on touchscreens). ──────
  const [drag, setDrag] = useState<{ id: string; label: string; color: string; x: number; y: number } | null>(null);
  const [overIso, setOverIso] = useState<string | null>(null);
  const dragStart = useRef<{
    id: string;
    iso: string;
    label: string;
    color: string;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  const canManage = manageableCategoryIds.length > 0 || manageableTeamIds.length > 0;
  const myCategories = useMemo(
    () => categories.filter((c) => manageableCategoryIds.includes(c.id)),
    [categories, manageableCategoryIds],
  );
  const myTeams = useMemo(
    () => teams.filter((tm) => manageableTeamIds.includes(tm.id)),
    [teams, manageableTeamIds],
  );

  function isMine(s: CalendarSessionItem) {
    return s.tipo === "entrenamiento"
      ? !!s.categoriaId && manageableCategoryIds.includes(s.categoriaId)
      : !!s.equipoId && manageableTeamIds.includes(s.equipoId);
  }

  const byDate = useMemo(() => {
    const m = new Map<string, CalendarSessionItem[]>();
    for (const s of sessions) {
      const arr = m.get(s.fecha) ?? [];
      arr.push(s);
      m.set(s.fecha, arr);
    }
    return m;
  }, [sessions]);

  function gotoMonth(delta: number) {
    router.push(`/attendance?month=${monthParam(shiftMonth(ym, delta))}`);
  }

  function openNew(date?: string) {
    setNewDate(date);
    setPanel("new");
  }

  function cellIsoAt(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y);
    return el?.closest<HTMLElement>("[data-day-iso]")?.dataset.dayIso ?? null;
  }

  function onWindowPointerMove(e: PointerEvent) {
    const ds = dragStart.current;
    if (!ds) return;
    if (!ds.moved && Math.hypot(e.clientX - ds.x, e.clientY - ds.y) < DRAG_THRESHOLD) {
      return;
    }
    if (!ds.moved) ds.moved = true;
    e.preventDefault();
    setDrag({ id: ds.id, label: ds.label, color: ds.color, x: e.clientX, y: e.clientY });
    setOverIso(cellIsoAt(e.clientX, e.clientY));
  }

  function endDrag(e: PointerEvent) {
    window.removeEventListener("pointermove", onWindowPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);

    const ds = dragStart.current;
    dragStart.current = null;
    setDrag(null);
    setOverIso(null);
    if (!ds?.moved) return;

    suppressClick.current = true;
    const iso = cellIsoAt(e.clientX, e.clientY);
    if (iso && iso !== ds.iso) {
      startTransition(() => {
        void moverSesion(ds.id, iso);
      });
    }
  }

  function onSessionPointerDown(e: React.PointerEvent<HTMLAnchorElement>, s: CalendarSessionItem) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const label = sessionLabel(s);
    dragStart.current = {
      id: s.id,
      iso: s.fecha,
      label,
      color: s.color,
      x: e.clientX,
      y: e.clientY,
      moved: false,
    };
    window.addEventListener("pointermove", onWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  }

  function onSessionClick(e: React.MouseEvent) {
    if (suppressClick.current) {
      e.preventDefault();
      suppressClick.current = false;
    }
  }

  function renderCell(cell: CalendarCell, tall: boolean) {
    const daySessions = byDate.get(cell.iso) ?? [];
    return (
      <div
        key={cell.iso}
        data-day-iso={cell.iso}
        className={cn(
          "group relative border-b border-r border-line p-1.5 transition-colors",
          tall ? "min-h-40" : "min-h-28",
          !cell.inMonth && "bg-surface-2/40",
          drag && overIso === cell.iso && "bg-brand-subtle ring-1 ring-inset ring-brand",
        )}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-xs tabular-nums",
              cell.isToday
                ? "flex size-5 items-center justify-center rounded-full bg-brand font-semibold text-brand-fg"
                : cell.inMonth
                  ? "text-muted"
                  : "text-faint",
            )}
          >
            {cell.day}
          </span>
          {canManage && (
            <button
              type="button"
              onClick={() => openNew(cell.iso)}
              aria-label={t("new")}
              className={cn(
                "rounded p-0.5 text-faint transition-opacity hover:bg-surface-2 hover:text-fg",
                tall
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
              )}
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </div>

        <div className="mt-1 space-y-1">
          {daySessions.map((s) => {
            const Icon = TYPE_ICON[s.tipo] ?? Dumbbell;
            const mine = isMine(s);
            const label = sessionLabel(s);
            return (
              <Link
                key={s.id}
                href={`/attendance/${s.id}`}
                onPointerDown={mine ? (e) => onSessionPointerDown(e, s) : undefined}
                onClick={onSessionClick}
                className={cn(
                  "flex items-center gap-1.5 truncate rounded-md border-l-2 px-2 py-1.5 text-[0.72rem] leading-tight hover:brightness-95",
                  mine && "cursor-grab touch-none select-none active:cursor-grabbing",
                  s.estado === "cancelada" && "opacity-50 line-through",
                  drag?.id === s.id && "opacity-40",
                )}
                style={{
                  borderLeftColor: s.color,
                  backgroundColor: `${s.color}1a`,
                }}
                title={`${label} · ${s.horaInicio?.slice(0, 5) ?? ""}`}
              >
                <Icon className="size-3.5 shrink-0" style={{ color: s.color }} />
                <span className="truncate">
                  {s.horaInicio ? `${s.horaInicio.slice(0, 5)} ` : ""}
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  /** Minutes from DAY_START_HOUR, clamped to the visible window. */
  function minutesFromStart(hhmm: string) {
    const [h, m] = hhmm.split(":").map(Number);
    const minutes = (h - DAY_START_HOUR) * 60 + m;
    return Math.min(Math.max(minutes, 0), (DAY_END_HOUR - DAY_START_HOUR) * 60);
  }

  /**
   * Side-by-side columns for sessions that overlap in time — e.g. two
   * categories training at the same hour. Absolutely-positioned blocks that
   * all spanned the full width would just stack on top of each other with
   * only the last one clickable, which is why a day with several trainings
   * at once used to look like it only had one.
   */
  function layoutOverlaps<T extends { start: number; end: number }>(items: T[]) {
    const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
    const positioned: { item: T; column: number; columns: number }[] = [];

    let cluster: T[] = [];
    let clusterEnd = -Infinity;
    const flushCluster = () => {
      if (cluster.length === 0) return;
      const columnEnds: number[] = [];
      const columnOf = new Map<T, number>();
      for (const item of cluster) {
        let col = columnEnds.findIndex((end) => end <= item.start);
        if (col === -1) {
          col = columnEnds.length;
          columnEnds.push(item.end);
        } else {
          columnEnds[col] = item.end;
        }
        columnOf.set(item, col);
      }
      for (const item of cluster) {
        positioned.push({ item, column: columnOf.get(item)!, columns: columnEnds.length });
      }
      cluster = [];
    };

    for (const item of sorted) {
      if (cluster.length > 0 && item.start >= clusterEnd) flushCluster();
      cluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.end);
    }
    flushCluster();

    return positioned;
  }

  /** Hour-by-hour timeline (8am–6pm) for the mobile day view — sessions land
   *  at their actual time instead of just stacking in a list. */
  function renderDayTimeline(day: CalendarCell) {
    const daySessions = byDate.get(day.iso) ?? [];
    const timed = daySessions.filter((s) => s.horaInicio);
    const untimed = daySessions.filter((s) => !s.horaInicio);
    const hours = Array.from(
      { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
      (_, i) => DAY_START_HOUR + i,
    );
    const totalHeight = (DAY_END_HOUR - DAY_START_HOUR) * PX_PER_HOUR;

    return (
      <div>
        {untimed.length > 0 && (
          <div className="space-y-1 border-b border-line p-2">
            {untimed.map((s) => {
              const Icon = TYPE_ICON[s.tipo] ?? Dumbbell;
              return (
                <Link
                  key={s.id}
                  href={`/attendance/${s.id}`}
                  className={cn(
                    "flex items-center gap-1.5 truncate rounded-md border-l-2 px-2 py-1.5 text-[0.72rem] leading-tight hover:brightness-95",
                    s.estado === "cancelada" && "opacity-50 line-through",
                  )}
                  style={{ borderLeftColor: s.color, backgroundColor: `${s.color}1a` }}
                >
                  <Icon className="size-3.5 shrink-0" style={{ color: s.color }} />
                  <span className="truncate">{sessionLabel(s)}</span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="relative" style={{ height: totalHeight }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute inset-x-0 border-t border-line"
              style={{ top: (h - DAY_START_HOUR) * PX_PER_HOUR }}
            >
              <span className="absolute -top-2 left-1 bg-surface px-0.5 text-[0.65rem] tabular-nums text-faint">
                {h}:00
              </span>
            </div>
          ))}

          <div className="absolute inset-y-0 left-10 right-1">
            {layoutOverlaps(
              timed.map((s) => ({
                s,
                start: minutesFromStart(s.horaInicio!),
                end: s.horaFin
                  ? minutesFromStart(s.horaFin)
                  : minutesFromStart(s.horaInicio!) + 60,
              })),
            ).map(({ item: { s, start, end }, column, columns }) => {
              const Icon = TYPE_ICON[s.tipo] ?? Dumbbell;
              const top = (start / 60) * PX_PER_HOUR;
              const height = Math.max(((end - start) / 60) * PX_PER_HOUR, 26);
              const widthPct = 100 / columns;
              return (
                <Link
                  key={s.id}
                  href={`/attendance/${s.id}`}
                  className={cn(
                    "absolute flex items-start gap-1.5 overflow-hidden rounded-md border-l-2 px-2 py-1 text-[0.72rem] leading-tight hover:brightness-95",
                    s.estado === "cancelada" && "opacity-50 line-through",
                  )}
                  style={{
                    top,
                    height,
                    left: `${column * widthPct}%`,
                    width: `calc(${widthPct}% - 4px)`,
                    borderLeftColor: s.color,
                    backgroundColor: `${s.color}1a`,
                  }}
                  title={`${sessionLabel(s)} · ${s.horaInicio?.slice(0, 5) ?? ""}`}
                >
                  <Icon className="mt-px size-3.5 shrink-0" style={{ color: s.color }} />
                  <span className="truncate">
                    {s.horaInicio?.slice(0, 5)} {sessionLabel(s)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Desktop/tablet — full month, paged a month at a time. */}
        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            onClick={() => gotoMonth(-1)}
            aria-label={t("monthPrev")}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="min-w-36 text-center text-sm font-semibold capitalize">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => gotoMonth(1)}
            aria-label={t("monthNext")}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Mobile — a month grid is too cramped on a phone screen, so this
            pages one week (or one day) at a time instead (crossing a
            boundary just loads the next/previous month and keeps going). */}
        <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={mobileView === "day" ? prevDay : prevWeek}
              aria-label={mobileView === "day" ? t("dayPrev") : t("weekPrev")}
              className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg"
            >
              <ChevronLeft className="size-5" />
            </button>
            <h2 className="min-w-28 text-center text-sm font-semibold capitalize">
              {mobileView === "day" ? dayLabel : weekLabel}
            </h2>
            <button
              type="button"
              onClick={mobileView === "day" ? nextDay : nextWeek}
              aria-label={mobileView === "day" ? t("dayNext") : t("weekNext")}
              className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="flex rounded-lg border border-line p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMobileView("week")}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors",
                mobileView === "week"
                  ? "bg-brand-subtle text-brand-legible"
                  : "text-muted",
              )}
            >
              {t("viewWeek")}
            </button>
            <button
              type="button"
              onClick={() => setMobileView("day")}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors",
                mobileView === "day"
                  ? "bg-brand-subtle text-brand-legible"
                  : "text-muted",
              )}
            >
              {t("viewDay")}
            </button>
          </div>
        </div>

        <CalendarFilters
          categories={categories}
          teams={teams}
          month={monthParam(ym)}
          categoriaFilter={categoriaFilter}
          equipoFilter={equipoFilter}
        />

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPanel(panel === "generate" ? "none" : "generate")}
              className={buttonClasses("secondary", "sm")}
            >
              <Sparkles className="size-3.5" />
              {t("generate")}
            </button>
            <button
              type="button"
              onClick={() =>
                panel === "new" ? setPanel("none") : openNew(currentDay.iso)
              }
              className={buttonClasses("primary", "sm")}
            >
              <Plus className="size-3.5" />
              {t("new")}
            </button>
          </div>
        )}
      </div>

      {panel === "generate" && (
        <GenerateSessionsForm categories={myCategories} onDone={() => setPanel("none")} />
      )}
      {panel === "new" && (
        <SessionForm
          mode="create"
          categories={myCategories}
          teams={myTeams}
          defaultDate={newDate}
          onDone={() => setPanel("none")}
        />
      )}

      {/* Desktop/tablet — the full month grid. */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface sm:block">
        <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-faint">
          {WEEKDAY_KEYS.map((k) => (
            <div key={k} className="py-2">
              {tc(k)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.map((week) => week.map((cell) => renderCell(cell, false)))}
        </div>
      </div>

      {/* Mobile — one week (bigger cells, always-visible "+" since there's no
          hover state to reveal it on a touchscreen) or, zoomed in further,
          just one day. */}
      {mobileView === "week" ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface sm:hidden">
          <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-faint">
            {WEEKDAY_KEYS.map((k) => (
              <div key={k} className="py-2">
                {tc(k)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {currentWeek.map((cell) => renderCell(cell, true))}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface p-2 sm:hidden">
          {renderDayTimeline(currentDay)}
        </div>
      )}

      {/* Ghost that follows the pointer/finger during a drag — the dragged
          chip itself stays put (dimmed) so it doesn't block the target cell
          underneath a touch. Offset above the finger so it stays visible. */}
      {drag && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 flex items-center gap-1.5 truncate rounded-md border-l-2 bg-surface px-2 py-1.5 text-[0.72rem] leading-tight shadow-pop"
          style={{
            left: drag.x,
            top: drag.y - 44,
            transform: "translateX(-50%)",
            borderLeftColor: drag.color,
          }}
        >
          <span className="truncate">{drag.label}</span>
        </div>
      )}
    </div>
  );
}
