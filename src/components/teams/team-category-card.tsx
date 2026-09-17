"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, Plus, UserRound, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ListPagination, usePagedList } from "@/components/ui/list-pagination";
import type { TeamGroup } from "@/server/teams";
import { WEEKDAY_LABEL_KEY } from "@/lib/weekdays";

/** One category with the teams inside it. The card is the unit on /teams. */
export function TeamCategoryCard({
  group,
  admin,
}: {
  group: TeamGroup;
  admin: boolean;
}) {
  const t = useTranslations("teams");
  const tc = useTranslations("common");

  const days = (group.diasEntreno ?? [])
    .map((d) => (WEEKDAY_LABEL_KEY[d] ? tc(WEEKDAY_LABEL_KEY[d]) : d))
    .join(" · ");
  const time = group.horaEntreno?.slice(0, 5) ?? null;
  const schedule = [days, time].filter(Boolean).join("  ·  ");
  const { page, setPage, pageCount, pageItems } = usePagedList(group.teams);

  return (
    <section className="flex flex-col rounded-2xl border border-line bg-surface">
      <header className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 border-b border-line px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
            style={{ backgroundColor: group.color }}
          />
          {group.categoria}
        </h2>
        {group.edadMin != null && group.edadMax != null && (
          <span className="text-xs text-muted">
            {t("ageRange", { min: group.edadMin, max: group.edadMax })}
          </span>
        )}
        {schedule && (
          <span className="w-full text-xs text-faint">{schedule}</span>
        )}
      </header>

      <div className="flex flex-1 flex-col divide-y divide-line">
        {group.teams.length === 0 ? (
          <p className="px-4 py-5 text-center text-xs text-muted">
            {t("catEmpty")}
          </p>
        ) : (
          pageItems.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium group-hover:text-brand-legible">
                  <span className="truncate">{team.nombre}</span>
                  {!team.activo && (
                    <Badge tone="neutral" className="shrink-0">
                      {t("inactive")}
                    </Badge>
                  )}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="size-3.5 shrink-0" />
                    <span className={team.coachName ? "" : "italic"}>
                      {team.coachName ?? t("noCoach")}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5 shrink-0" />
                    {t("playerCount", { count: team.playerCount })}
                  </span>
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-faint transition-transform duration-200 ease-out-soft group-hover:translate-x-0.5 group-hover:text-muted" />
            </Link>
          ))
        )}

        {pageCount > 1 && (
          <div className="px-4 py-2">
            <ListPagination page={page} pageCount={pageCount} onChange={setPage} />
          </div>
        )}

        {admin && (
          <Link
            href={`/teams/new?categoria=${group.categoriaId}`}
            className="mt-auto flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-brand-legible transition-colors hover:bg-brand-subtle/60"
          >
            <Plus className="size-3.5" />
            {t("addTeam")}
          </Link>
        )}
      </div>
    </section>
  );
}
