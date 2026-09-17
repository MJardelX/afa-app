import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CheckCheck,
  Sparkles,
  TrendingDown,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { Modules } from "@/components/app/modules";
import { WelcomeBanner } from "@/components/app/welcome-banner";
import {
  AttendanceBadge,
  attendanceLevel,
} from "@/components/ui/attendance-badge";
import { BarList } from "@/components/ui/bar-list";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Metric } from "@/components/ui/metric";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("dashboard");
  return { title: t("metaTitle") };
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tRoles = await getTranslations("roles");
  const tLevel = await getTranslations("attendanceLevel");
  const locale = await getLocale();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Everything goes through RLS: what each query returns depends on the role.
  const [
    { data: profile },
    { data: academy },
    { data: season },
    { data: players },
    { data: ranking },
    { count: teams },
    { count: categories },
  ] = await Promise.all([
    supabase
      .from("perfiles")
      .select("nombre_completo, rol")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
    supabase.from("academias").select("nombre").maybeSingle(),
    supabase
      .from("temporadas")
      .select("nombre, fecha_inicio, fecha_fin")
      .eq("activa", true)
      .maybeSingle(),
    supabase
      .from("v_jugadores")
      .select(
        "id, codigo, nombre_completo, categoria, categoria_por_edad, edad_deportiva, fuera_de_categoria, sin_inscribir, estado",
      )
      .eq("estado", "activo"),
    supabase
      .from("v_ranking_equipo")
      .select(
        "jugador_id, nombre_completo, categoria, porcentaje, sesiones_convocadas",
      ),
    supabase.from("equipos").select("*", { count: "exact", head: true }),
    supabase.from("categorias").select("*", { count: "exact", head: true }),
  ]);

  const playerList = players ?? [];
  const rankingRows = ranking ?? [];

  const byCategory = groupByCategory(playerList);
  const average = averageAttendance(rankingRows);
  const lowCount = rankingRows.filter(
    (r) => r.porcentaje !== null && r.porcentaje < 70,
  ).length;
  const alerts = buildAlerts(playerList, rankingRows, t);

  const firstName =
    (profile?.nombre_completo ?? "").trim().split(/\s+/)[0] || "";
  const greeting = t(greetingKeyForHour());
  const title = firstName
    ? t("hello", { greeting, name: firstName })
    : greeting;

  const today = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Guatemala",
  }).format(new Date());

  const attendanceDelta =
    average === null
      ? undefined
      : {
          tone: (
            { good: "up", fair: "warn", low: "down" } as const
          )[attendanceLevel(average)],
          label: tLevel(attendanceLevel(average)),
        };

  return (
    // The layout adds top padding for every page's header; the dashboard's
    // hero is happier flush to the top, so cancel it here.
    <div className="space-y-6 -mt-4 lg:-mt-8">
      <WelcomeBanner
        kicker={
          season?.nombre ? `${today} · ${season.nombre}` : today
        }
        title={title}
        subtitle={buildSubtitle(t, {
          alerts: alerts.length,
          players: playerList.length,
          average,
        })}
        stats={[
          { label: t("statActivePlayers"), value: playerList.length },
          { label: t("statCategories"), value: categories ?? 0 },
          { label: t("statTeams"), value: teams ?? 0 },
          {
            label: t("statAvgAttendance"),
            value: average === null ? "—" : `${average}%`,
          },
        ]}
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          title={t("metricActivePlayers")}
          value={playerList.length}
          foot={
            byCategory.length > 0
              ? t("metricActivePlayersWith", { count: byCategory.length })
              : t("metricActivePlayersNone")
          }
          tone="brand"
          icon={<Users strokeWidth={1.75} />}
        />

        <Metric
          title={t("metricAvgAttendance")}
          value={average === null ? "—" : `${average}%`}
          delta={attendanceDelta}
          foot={
            average === null
              ? t("metricAvgAttendanceNone")
              : t("metricAvgAttendanceHint")
          }
          tone={average === null ? "brand" : attendanceLevel(average)}
          icon={<CalendarCheck strokeWidth={1.75} />}
        />

        <Metric
          title={t("metricLowAttendance")}
          value={lowCount}
          foot={
            lowCount === 0
              ? t("metricLowAttendanceNone")
              : t("metricLowAttendanceSome")
          }
          tone={lowCount === 0 ? "good" : "low"}
          icon={<TrendingDown strokeWidth={1.75} />}
        />

        <Metric
          title={t("metricAlerts")}
          value={alerts.length}
          delta={
            alerts.length > 0
              ? { tone: "warn", label: t("metricAlertsSome") }
              : undefined
          }
          foot={alerts.length === 0 ? t("metricAlertsNone") : undefined}
          tone={alerts.length === 0 ? "good" : "accent"}
          icon={<Bell strokeWidth={1.75} />}
        />
      </section>

      <ContextBanner alerts={alerts} />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardTitle extra={t("playerCount", { count: playerList.length })}>
              {t("byCategoryTitle")}
            </CardTitle>
            <BarList
              data={byCategory}
              empty={
                <EmptyState
                  icon={<Users strokeWidth={1.5} />}
                  title={t("byCategoryEmpty")}
                />
              }
            />
          </Card>

          <Card>
            <CardTitle
              extra={
                rankingRows.length > 0
                  ? t("attendanceByPlayerOrder")
                  : undefined
              }
            >
              {t("attendanceByPlayerTitle")}
            </CardTitle>
            {rankingRows.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck strokeWidth={1.5} />}
                title={t("attendanceByPlayerEmpty")}
              />
            ) : (
              <ul className="-mx-2 -my-1">
                {[...rankingRows]
                  .sort((a, b) => (a.porcentaje ?? 0) - (b.porcentaje ?? 0))
                  .slice(0, 6)
                  .map((r) => (
                    <li
                      key={r.jugador_id}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {r.nombre_completo}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {r.categoria} ·{" "}
                          {t("calledUp", {
                            count: r.sesiones_convocadas ?? 0,
                          })}
                        </p>
                      </div>
                      <AttendanceBadge
                        level={attendanceLevel(r.porcentaje ?? 0)}
                        percent={Math.round(r.porcentaje ?? 0)}
                      />
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          <Modules />
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle>{t("academyTitle")}</CardTitle>
            <dl className="divide-y divide-line text-sm">
              <Detail
                term={t("academyRowAcademy")}
                value={academy?.nombre ?? "—"}
              />
              <Detail
                term={t("academyRowSeason")}
                value={season?.nombre ?? t("academyRowNoSeason")}
              />
              <Detail
                term={t("academyRowPeriod")}
                value={dateRange(
                  locale,
                  season?.fecha_inicio,
                  season?.fecha_fin,
                )}
              />
              <Detail
                term={t("academyRowRole")}
                value={
                  profile?.rol
                    ? tRoles.has(profile.rol)
                      ? tRoles(profile.rol)
                      : profile.rol
                    : "—"
                }
              />
            </dl>
          </Card>

          <Card className="scroll-mt-24" id="alerts">
            <CardTitle extra={alerts.length > 0 ? `${alerts.length}` : undefined}>
              {t("alertsTitle")}
            </CardTitle>
            {alerts.length === 0 ? (
              <EmptyState
                icon={<CheckCheck strokeWidth={1.5} />}
                title={t("alertsEmpty")}
              />
            ) : (
              <ul className="-mx-2 space-y-0.5">
                {alerts.map((a) => (
                  <li
                    key={a.key}
                    className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg">
                      <TriangleAlert className="size-3" strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm">{a.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{a.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Local pieces
   --------------------------------------------------------------------------- */

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted">{term}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{value}</dd>
    </div>
  );
}

/**
 * Context strip: sums up what to look at today and links to it. Subtle brand
 * surface, not glass: it is fixed content within the flow.
 */
async function ContextBanner({ alerts }: { alerts: Alert[] }) {
  const t = await getTranslations("dashboard");
  const hasAlerts = alerts.length > 0;

  return (
    <section className="glass-panel flex flex-col gap-3.5 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-4">
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
          hasAlerts ? "bg-accent text-accent-fg" : "bg-brand text-brand-fg",
        )}
      >
        {hasAlerts ? (
          <TriangleAlert className="size-[1.15rem]" strokeWidth={1.9} />
        ) : (
          <Sparkles className="size-[1.15rem]" strokeWidth={1.9} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {hasAlerts ? t("contextNeedAttention") : t("contextAllClear")}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {hasAlerts
            ? `${alerts[0].title}${
                alerts.length > 1
                  ? t("contextAndMore", { count: alerts.length - 1 })
                  : ""
              }`
            : t("contextAllClearBody")}
        </p>
      </div>

      {hasAlerts && (
        <Link
          href="#alerts"
          className="group inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-medium text-brand-fg shadow-sm transition-colors hover:bg-brand-hover"
        >
          {t("contextViewAlerts")}
          <ArrowRight
            aria-hidden
            strokeWidth={2}
            className="size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Computations. Done here and not in the database: they are aggregations over
   a few hundred rows that already came filtered by RLS.
   --------------------------------------------------------------------------- */

/** The translator returned by `getTranslations("dashboard")`. */
type DashboardT = Awaited<ReturnType<typeof getTranslations>>;

function greetingKeyForHour() {
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Guatemala",
    }).format(new Date()),
  );
  if (hour < 12) return "greetingMorning" as const;
  if (hour < 19) return "greetingAfternoon" as const;
  return "greetingEvening" as const;
}

function buildSubtitle(
  t: DashboardT,
  {
    alerts,
    players,
    average,
  }: { alerts: number; players: number; average: number | null },
) {
  if (alerts > 0) return t("subtitleAlerts", { count: alerts });
  if (players === 0) return t("subtitleEmpty");
  const attendance =
    average === null
      ? t("subtitleOkNoSessions")
      : t("subtitleOkAttendance", { value: average });
  return t("subtitleOk", { players, attendance });
}

function dateRange(
  locale: string,
  start?: string | null,
  end?: string | null,
) {
  if (!start || !end) return "—";
  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

type Player = {
  id: string | null;
  codigo: string | null;
  nombre_completo: string | null;
  categoria: string | null;
  categoria_por_edad: string | null;
  fuera_de_categoria: boolean | null;
  sin_inscribir: boolean | null;
};

type RankingRow = {
  jugador_id: string | null;
  nombre_completo: string | null;
  porcentaje: number | null;
};

type Alert = { key: string; title: string; detail: string };

function groupByCategory(players: Player[]) {
  const count = new Map<string, number>();
  for (const p of players) {
    const key = p.categoria ?? p.categoria_por_edad ?? "—";
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  return [...count.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function averageAttendance(rows: RankingRow[]) {
  const valid = rows
    .map((r) => r.porcentaje)
    .filter((p): p is number => p !== null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

function buildAlerts(
  players: Player[],
  rows: RankingRow[],
  t: DashboardT,
): Alert[] {
  const alerts: Alert[] = [];

  for (const p of players) {
    if (p.sin_inscribir) {
      alerts.push({
        key: `unregistered-${p.id}`,
        title: t("alertNotRegistered", { name: p.nombre_completo ?? "—" }),
        detail: t("alertNotRegisteredDetail", {
          code: p.codigo ?? "—",
          category: p.categoria_por_edad ?? t("noCategory"),
        }),
      });
    } else if (p.fuera_de_categoria) {
      alerts.push({
        key: `off-category-${p.id}`,
        title: t("alertOutOfCategory", { name: p.nombre_completo ?? "—" }),
        detail: t("alertOutOfCategoryDetail", {
          current: p.categoria ?? "—",
          expected: p.categoria_por_edad ?? t("noCategory"),
        }),
      });
    }
  }

  for (const r of rows) {
    if (r.porcentaje !== null && r.porcentaje < 70) {
      alerts.push({
        key: `attendance-${r.jugador_id}`,
        title: t("alertLowAttendance", { name: r.nombre_completo ?? "—" }),
        detail: t("alertLowAttendanceDetail", {
          percent: Math.round(r.porcentaje),
        }),
      });
    }
  }

  return alerts;
}
