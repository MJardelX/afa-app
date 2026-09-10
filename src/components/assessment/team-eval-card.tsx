import Link from "next/link";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";

import type { CalendarTeam } from "@/server/attendance";
import type { TeamEvalSummary } from "@/server/evaluation";

export function TeamEvalCard({
  team,
  periodId,
  summary,
}: {
  team: CalendarTeam;
  periodId: string;
  summary?: TeamEvalSummary;
}) {
  const t = useTranslations("evaluation");
  const done = summary?.finalizadas ?? 0;
  const total = summary?.total ?? 0;
  const pct = total ? Math.round((100 * done) / total) : 0;

  return (
    <Link
      href={`/assessment/${team.id}?period=${periodId}`}
      className="group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 transition-[border-color] duration-200 ease-out-soft hover:border-line-strong"
    >
      <h3 className="font-semibold group-hover:text-brand-legible">{team.nombre}</h3>
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Users className="size-3.5 shrink-0" />
        <span>{t("progress", { done, total })}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
