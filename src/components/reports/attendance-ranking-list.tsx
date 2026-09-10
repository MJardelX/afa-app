import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { RankBadge } from "@/components/reports/rank-badge";
import {
  AttendanceBadge,
  attendanceLevel,
} from "@/components/ui/attendance-badge";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, Td, Th, Tr } from "@/components/ui/data-table";
import type { AttendanceRankRow } from "@/server/reports";

export async function AttendanceRankingList({
  rows,
}: {
  rows: AttendanceRankRow[];
}) {
  const t = await getTranslations("reports");

  return (
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
        {rows.map((r) => (
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
  );
}
