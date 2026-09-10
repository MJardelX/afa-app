import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus, Users } from "lucide-react";

import { PlayerCard } from "@/components/players/player-card";
import { PlayerFilters } from "@/components/players/player-filters";
import { PlayersNav } from "@/components/players/players-nav";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import {
  activeCategories,
  currentProfile,
  isAdmin,
  listPlayers,
  type PlayerFlag,
  type PlayerStatus,
} from "@/server/players";

export async function generateMetadata() {
  const t = await getTranslations("players");
  return { title: t("metaTitle") };
}

function str(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("players");
  const tc = await getTranslations("common");
  const sp = await searchParams;

  const q = str(sp.q);
  const categoria = str(sp.categoria);
  const estado = (str(sp.estado) || "activo") as PlayerStatus | "todos";
  const flagRaw = str(sp.flag);
  const flag: PlayerFlag | undefined =
    flagRaw === "sin_inscribir" ||
    flagRaw === "sin_equipo" ||
    flagRaw === "fuera_de_categoria"
      ? flagRaw
      : undefined;
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const [{ rows, total, pageSize }, categories, profile] = await Promise.all([
    listPlayers({ q, categoria, estado, flag, page }),
    activeCategories(),
    currentProfile(),
  ]);

  const admin = isAdmin(profile?.rol);
  const filtering = Boolean(q || categoria || flag);

  const colorByCategory = new Map(categories.map((c) => [c.id, c.color]));

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          admin ? (
            <Link href="/players/new" className={buttonClasses("primary", "md")}>
              <Plus className="size-4" />
              {t("new")}
            </Link>
          ) : undefined
        }
      />

      <PlayersNav />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder={t("searchPlaceholder")} />
        <PlayerFilters categories={categories} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users strokeWidth={1.5} />}
          title={filtering ? t("emptySearch") : t("empty")}
          hint={!filtering && admin ? t("emptyHint") : undefined}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted">
            {tc("range", {
              from: (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, total),
              total,
            })}
          </p>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
            {rows.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                categoryColor={
                  colorByCategory.get(
                    p.categoria_id ?? p.categoria_por_edad_id ?? "",
                  ) ?? null
                }
              />
            ))}
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            searchParams={{ q, categoria, estado, flag }}
            labelRange={(from, to, tot) =>
              tc("range", { from, to, total: tot })
            }
          />
        </div>
      )}
    </div>
  );
}
