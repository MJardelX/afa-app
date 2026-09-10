"use client";

import { useMemo, useState, useTransition, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { monthParam, shiftMonth, type YearMonth } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, LucideIcon> = {
  entrenamiento: Dumbbell,
  partido: Trophy,
  amistoso: Handshake,
  torneo: Award,
};

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
  const router = useRouter();
  const [panel, setPanel] = useState<"none" | "new" | "generate">("none");
  const [newDate, setNewDate] = useState<string | undefined>(undefined);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

  function handleDrop(e: DragEvent<HTMLDivElement>, iso: string) {
    e.preventDefault();
    if (!dragId) return;
    const id = dragId;
    setDragId(null);
    startTransition(() => {
      void moverSesion(id, iso);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
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
              onClick={() => (panel === "new" ? setPanel("none") : openNew())}
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

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-faint">
          {WEEKDAY_KEYS.map((k) => (
            <div key={k} className="py-2">
              {tc(k)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.map((week) =>
            week.map((cell) => {
              const daySessions = byDate.get(cell.iso) ?? [];
              return (
                <div
                  key={cell.iso}
                  onDragOver={canManage ? (e) => e.preventDefault() : undefined}
                  onDrop={canManage ? (e) => handleDrop(e, cell.iso) : undefined}
                  className={cn(
                    "group relative min-h-24 border-b border-r border-line p-1.5",
                    !cell.inMonth && "bg-surface-2/40",
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
                        className="rounded p-0.5 text-faint opacity-0 transition-opacity hover:bg-surface-2 hover:text-fg group-hover:opacity-100 group-focus-within:opacity-100"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-1 space-y-1">
                    {daySessions.map((s) => {
                      const Icon = TYPE_ICON[s.tipo] ?? Dumbbell;
                      const mine = isMine(s);
                      const label =
                        s.tipo === "entrenamiento" ? s.categoria : (s.equipo ?? s.categoria);
                      return (
                        <Link
                          key={s.id}
                          href={`/attendance/${s.id}`}
                          draggable={mine}
                          onDragStart={mine ? () => setDragId(s.id) : undefined}
                          onDragEnd={() => setDragId(null)}
                          className={cn(
                            "flex items-center gap-1 truncate rounded-md border-l-2 px-1.5 py-1 text-[0.68rem] leading-tight hover:brightness-95",
                            mine && "cursor-grab active:cursor-grabbing",
                            s.estado === "cancelada" && "opacity-50 line-through",
                          )}
                          style={{
                            borderLeftColor: s.color,
                            backgroundColor: `${s.color}1a`,
                          }}
                          title={`${label} · ${s.horaInicio?.slice(0, 5) ?? ""}`}
                        >
                          <Icon className="size-3 shrink-0" style={{ color: s.color }} />
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
            }),
          )}
        </div>
      </div>
    </div>
  );
}
