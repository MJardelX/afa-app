"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { DataTable, Td, Th, Tr } from "@/components/ui/data-table";
import { ListPagination, usePagedList } from "@/components/ui/list-pagination";
import type { PlayerEvalStatus } from "@/server/evaluation";

const STATUS_TONE: Record<string, BadgeTone> = {
  borrador: "warn",
  finalizada: "good",
};

export function RosterStatusList({
  categoriaId,
  periodId,
  roster,
}: {
  categoriaId: string;
  periodId: string;
  roster: PlayerEvalStatus[];
}) {
  const t = useTranslations("evaluation");
  const tc = useTranslations("common");
  const { page, setPage, pageCount, pageItems } = usePagedList(roster);

  if (roster.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">{t("noRoster")}</p>;
  }

  return (
    <div className="space-y-3">
      <DataTable bare>
        <thead>
          <Tr head>
            <Th>{t("colPlayer")}</Th>
            <Th>{t("colStatus")}</Th>
            <Th align="right" className="w-px">
              <span className="sr-only">{tc("actions")}</span>
            </Th>
          </Tr>
        </thead>
        <tbody>
          {pageItems.map((p) => {
            const name = `${p.nombres} ${p.apellidos}`.trim();
            return (
              <Tr key={p.jugadorId}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{name}</span>
                      <span className="block truncate text-xs text-faint">
                        {p.codigo}
                        {p.equipo ? ` · ${p.equipo}` : ""}
                      </span>
                    </span>
                  </div>
                </Td>
                <Td>
                  <Badge tone={p.estado ? STATUS_TONE[p.estado] : "neutral"}>
                    {p.estado === "finalizada"
                      ? t("statusFinalized")
                      : p.estado === "borrador"
                        ? t("statusDraft")
                        : t("statusNotStarted")}
                  </Badge>
                </Td>
                <Td align="right">
                  <Link
                    href={`/assessment/${categoriaId}/${p.jugadorId}?period=${periodId}`}
                    className="text-xs font-medium text-brand-legible hover:underline"
                  >
                    {p.estado ? t("review") : t("evaluate")}
                  </Link>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </DataTable>
      <ListPagination page={page} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
