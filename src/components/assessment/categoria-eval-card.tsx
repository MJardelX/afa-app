import Link from "next/link";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";

import type { CategoriaEvalSummary } from "@/server/evaluation";

export function CategoriaEvalCard({
  categoria,
  periodId,
  summary,
}: {
  categoria: { id: string; nombre: string; color: string };
  periodId: string;
  summary?: CategoriaEvalSummary;
}) {
  const t = useTranslations("evaluation");
  const done = summary?.finalizadas ?? 0;
  const total = summary?.total ?? 0;
  const pct = total ? Math.round((100 * done) / total) : 0;

  return (
    <Link
      href={`/assessment/${categoria.id}?period=${periodId}`}
      className="group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 transition-[border-color] duration-200 ease-out-soft hover:border-line-strong"
    >
      <h3 className="flex items-center gap-2 font-semibold group-hover:text-brand-legible">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: categoria.color }}
        />
        {categoria.nombre}
      </h3>
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
