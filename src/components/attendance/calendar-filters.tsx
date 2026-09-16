"use client";

import { useRouter } from "nextjs-toploader/app";
import { useTranslations } from "next-intl";

import { Select } from "@/components/ui/field";
import type {
  CalendarCategoryOption,
  CalendarTeamOption,
} from "@/components/attendance/types";

export function CalendarFilters({
  categories,
  teams,
  month,
  categoriaFilter,
  equipoFilter,
}: {
  categories: CalendarCategoryOption[];
  teams: CalendarTeamOption[];
  month: string;
  categoriaFilter: string;
  equipoFilter: string;
}) {
  const t = useTranslations("attendance");
  const router = useRouter();

  const teamsInCategory = categoriaFilter
    ? teams.filter((tm) => tm.categoriaId === categoriaFilter)
    : teams;

  function go(categoria: string, equipo: string) {
    const params = new URLSearchParams({ month });
    if (categoria) params.set("categoria", categoria);
    if (equipo) params.set("equipo", equipo);
    router.push(`/attendance?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label={t("allCategories")}
        value={categoriaFilter}
        onChange={(e) => go(e.target.value, "")}
        className="h-8 w-auto text-xs"
      >
        <option value="">{t("allCategories")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </Select>
      <Select
        aria-label={t("allTeams")}
        value={equipoFilter}
        onChange={(e) => go(categoriaFilter, e.target.value)}
        className="h-8 w-auto text-xs"
      >
        <option value="">{t("allTeams")}</option>
        {teamsInCategory.map((tm) => (
          <option key={tm.id} value={tm.id}>
            {tm.nombre}
          </option>
        ))}
      </Select>
    </div>
  );
}
