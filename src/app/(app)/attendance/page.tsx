import { getLocale, getTranslations } from "next-intl/server";

import { AttendanceCalendar } from "@/components/attendance/calendar";
import { PageHeader } from "@/components/ui/page-header";
import { monthGrid, parseMonthParam, toISODate } from "@/lib/calendar";
import { currentProfile, isAdmin } from "@/server/players";
import {
  listCalendarCategories,
  listCalendarTeams,
  listSessions,
} from "@/server/attendance";

export async function generateMetadata() {
  const t = await getTranslations("attendance");
  return { title: t("metaTitle") };
}

function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("attendance");
  const locale = await getLocale();
  const sp = await searchParams;

  const ym = parseMonthParam(str(sp.month));
  const weeks = monthGrid(ym);
  const from = toISODate(weeks[0][0]);
  const to = toISODate(weeks[weeks.length - 1][6]);
  const todayIso = toISODate(new Date());

  const [categories, teams, sessions, profile] = await Promise.all([
    listCalendarCategories(),
    listCalendarTeams(),
    listSessions(from, to),
    currentProfile(),
  ]);
  const admin = isAdmin(profile?.rol);

  const manageableTeamIds = teams
    .filter(
      (tm) =>
        admin || tm.entrenadorId === profile?.id || tm.auxiliarId === profile?.id,
    )
    .map((tm) => tm.id);
  const manageableCategoryIds = admin
    ? categories.map((c) => c.id)
    : [...new Set(teams.filter((tm) => manageableTeamIds.includes(tm.id)).map((tm) => tm.categoriaId))];

  const categoriaFilter = str(sp.categoria);
  const equipoFilter = str(sp.equipo);
  const filteredSessions = sessions.filter(
    (s) =>
      (!categoriaFilter || s.categoriaId === categoriaFilter) &&
      (!equipoFilter || s.equipoId === equipoFilter),
  );

  const cells = weeks.map((week) =>
    week.map((d) => {
      const iso = toISODate(d);
      return {
        iso,
        day: d.getDate(),
        inMonth: d.getMonth() === ym.month0,
        isToday: iso === todayIso,
      };
    }),
  );

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(ym.year, ym.month0, 1));

  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <AttendanceCalendar
        ym={ym}
        weeks={cells}
        monthLabel={monthLabel}
        sessions={filteredSessions}
        categories={categories}
        teams={teams}
        manageableCategoryIds={manageableCategoryIds}
        manageableTeamIds={manageableTeamIds}
        categoriaFilter={categoriaFilter}
        equipoFilter={equipoFilter}
      />
    </div>
  );
}
