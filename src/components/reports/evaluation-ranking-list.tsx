"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { RankBadge } from "@/components/reports/rank-badge";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, Td, Th, Tr } from "@/components/ui/data-table";
import { ListPagination, usePagedList } from "@/components/ui/list-pagination";
import type { EvaluationRankRow } from "@/server/reports";

export function EvaluationRankingList({
  rows,
}: {
  rows: EvaluationRankRow[];
}) {
  const t = useTranslations("reports");
  const { page, setPage, pageCount, pageItems } = usePagedList(rows);

  return (
    <div className="space-y-3">
      <DataTable>
        <thead>
          <Tr head>
            <Th align="center" className="w-12">
              {t("colRank")}
            </Th>
            <Th>{t("colPlayer")}</Th>
            <Th align="right">{t("colAverage")}</Th>
          </Tr>
        </thead>
        <tbody>
          {pageItems.map((r) => (
            <Tr key={r.jugadorId}>
              <Td align="center">
                <RankBadge rank={r.puestoCategoria} />
              </Td>
              <Td>
                <Link
                  href={`/players/${r.jugadorId}`}
                  className="group flex items-center gap-3"
                >
                  <Avatar name={r.nombre} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium group-hover:text-brand-legible">
                      {r.nombre}
                    </span>
                    <span className="block truncate text-xs font-normal text-faint">
                      {r.equipo ?? "—"} · {r.codigo}
                    </span>
                  </span>
                </Link>
              </Td>
              <Td align="right" className="text-sm font-semibold tabular-nums">
                {r.promedio.toFixed(2)}
              </Td>
            </Tr>
          ))}
        </tbody>
      </DataTable>
      <ListPagination page={page} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
