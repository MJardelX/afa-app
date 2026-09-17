"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { RankBadge } from "@/components/reports/rank-badge";
import {
  AttendanceBadge,
  attendanceLevel,
} from "@/components/ui/attendance-badge";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, Td, Th, Tr } from "@/components/ui/data-table";
import { ListPagination, usePagedList } from "@/components/ui/list-pagination";
import type { AttendanceRankRow } from "@/server/reports";

export function AttendanceRankingList({
  rows,
}: {
  rows: AttendanceRankRow[];
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
            <Th className="hidden sm:table-cell">{t("colAttendance")}</Th>
            <Th align="right">{t("colPercent")}</Th>
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
                      {r.equipo} · {r.codigo}
                    </span>
                  </span>
                </Link>
              </Td>
              <Td className="hidden text-xs text-muted sm:table-cell">
                {t("attendanceBreakdown", {
                  presentes: r.presentes,
                  tardes: r.tardes,
                  ausentes: r.ausentes,
                })}
              </Td>
              <Td align="right">
                <AttendanceBadge
                  level={attendanceLevel(r.porcentaje)}
                  percent={r.porcentaje}
                />
              </Td>
            </Tr>
          ))}
        </tbody>
      </DataTable>
      <ListPagination page={page} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
