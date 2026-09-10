"use client";

import type { ComponentProps } from "react";
import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type Category = { id: string; nombre: string };

/** Category / status / flag selects. Each writes to the URL and resets ?page. */
export function PlayerFilters({ categories }: { categories: Category[] }) {
  const t = useTranslations("players");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function set(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  const categoria = params.get("categoria") ?? "";
  const estado = params.get("estado") ?? "activo";
  const flag = params.get("flag") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={pending}>
      <FilterSelect
        aria-label={t("filterCategory")}
        value={categoria}
        active={!!categoria}
        onChange={(e) => set("categoria", e.target.value)}
      >
        <option value="">{t("allCategories")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        aria-label={t("filterStatus")}
        value={estado}
        active={estado !== "activo"}
        onChange={(e) => set("estado", e.target.value)}
      >
        <option value="activo">{t("statusActivo")}</option>
        <option value="inactivo">{t("statusInactivo")}</option>
        <option value="retirado">{t("statusRetirado")}</option>
        <option value="egresado">{t("statusEgresado")}</option>
        <option value="todos">{t("allStatuses")}</option>
      </FilterSelect>

      <FilterSelect
        aria-label={t("filterFlag")}
        value={flag}
        active={!!flag}
        onChange={(e) => set("flag", e.target.value)}
      >
        <option value="">{t("flagAll")}</option>
        <option value="sin_inscribir">{t("flagUnenrolled")}</option>
        <option value="sin_equipo">{t("flagNoTeam")}</option>
        <option value="fuera_de_categoria">{t("flagOffCategory")}</option>
      </FilterSelect>
    </div>
  );
}

/** A quiet dropdown chip: muted at its default value, brand-tinted once set. */
function FilterSelect({
  active,
  className,
  children,
  ...props
}: ComponentProps<"select"> & { active?: boolean }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          "h-10 cursor-pointer appearance-none rounded-lg border py-0 pl-3 pr-8 text-sm font-medium transition-colors focus:border-brand focus:outline-none",
          active
            ? "border-brand/40 bg-brand-subtle text-brand-legible"
            : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
          className,
        )}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className={cn(
          "pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 fill-none stroke-[1.6]",
          active ? "stroke-brand-legible" : "stroke-muted",
        )}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 8 4 4 4-4" />
      </svg>
    </div>
  );
}
