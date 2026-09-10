import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { DataTable, Td, Th, Tr } from "@/components/ui/data-table";
import type { PlayerEvalStatus } from "@/server/evaluation";

const STATUS_TONE: Record<string, BadgeTone> = {
  borrador: "warn",
  finalizada: "good",
};

export async function RosterStatusList({
  teamId,
  periodId,
  roster,
}: {
  teamId: string;
  periodId: string;
  roster: PlayerEvalStatus[];
}) {
  const t = await getTranslations("evaluation");
  const tc = await getTranslations("common");

  if (roster.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">{t("noRoster")}</p>;
  }

  return (
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
        {roster.map((p) => {
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
                  href={`/assessment/${teamId}/${p.jugadorId}?period=${periodId}`}
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
  );
}
