import type { CSSProperties } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { PlayerStatusBadge } from "@/components/players/status-badge";
import { InfoHint } from "@/components/ui/info-hint";
import { fullName } from "@/lib/format";

type PlayerRow = {
  id: string | null;
  nombres: string | null;
  apellidos: string | null;
  nombre_completo: string | null;
  codigo: string | null;
  fecha_nacimiento: string | null;
  estado: string | null;
  categoria: string | null;
  categoria_id: string | null;
  categoria_por_edad: string | null;
  fuera_de_categoria: boolean | null;
  sin_inscribir: boolean | null;
  sin_equipo: boolean | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/** One player in the grid. Category is carried as the card's single accent —
 *  a thin ring on the avatar and a dot in the footer. */
export function PlayerCard({
  player,
  categoryColor = null,
}: {
  player: PlayerRow;
  categoryColor?: string | null;
}) {
  const t = useTranslations("players");
  const name = player.nombre_completo ?? fullName(player);
  const birthYear = player.fecha_nacimiento?.slice(0, 4) ?? null;
  const accent = categoryColor ?? "var(--line-strong)";
  const showStatus = !!player.estado && player.estado !== "activo";
  const categoryName =
    player.categoria ?? player.categoria_por_edad ?? "—";

  if (!player.id) return null;

  return (
    <Link
      href={`/players/${player.id}`}
      className="group flex flex-col rounded-2xl border border-line bg-surface p-4 transition-[border-color] duration-200 ease-out-soft hover:border-line-strong"
    >
      {/* Identity */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-semibold text-fg-muted"
          style={
            {
              boxShadow: `0 0 0 2px var(--surface), 0 0 0 3.5px ${accent}`,
            } as CSSProperties
          }
        >
          {initials(name || "?")}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-snug group-hover:text-brand-legible">
            {name}
          </p>
          <p className="mt-0.5 truncate text-xs tabular-nums text-faint">
            {player.codigo}
          </p>
        </div>

        {showStatus && (
          <div className="shrink-0">
            <PlayerStatusBadge estado={player.estado!} />
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-line pt-3">
        {player.sin_inscribir ? (
          <span className="text-xs font-medium text-muted">
            {t("unenrolled")}
          </span>
        ) : (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: accent }}
            />
            <span className="truncate">{categoryName}</span>
            {player.fuera_de_categoria && (
              <InfoHint
                label={t("outOfCategory")}
                text={
                  player.categoria_por_edad
                    ? t("outOfCategoryNote", {
                        current: player.categoria ?? "—",
                        expected: player.categoria_por_edad,
                      })
                    : t("noAgeCategoryNote", {
                        current: player.categoria ?? "—",
                      })
                }
              />
            )}
          </span>
        )}

        {birthYear && (
          <span className="shrink-0 text-[0.7rem] tabular-nums text-faint">
            {t("birthClass", { year: birthYear })}
          </span>
        )}
      </div>

      {player.sin_equipo && (
        <span className="mt-2 inline-flex w-fit items-center rounded-full bg-surface-2 px-2 py-0.5 text-[0.7rem] font-medium text-muted ring-1 ring-inset ring-line">
          {t("noTeamYet")}
        </span>
      )}
    </Link>
  );
}
