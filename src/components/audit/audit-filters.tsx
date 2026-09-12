"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ACTION_KEY, AUDIT_ACTIONS, AUDIT_TABLES, TABLE_KEY } from "@/components/audit/labels";
import { Select } from "@/components/ui/field";

export function AuditFilters() {
  const t = useTranslations("audit");
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

  return (
    <div className="flex flex-wrap gap-2" aria-busy={pending}>
      <Select
        aria-label={t("filterTable")}
        value={params.get("tabla") ?? ""}
        onChange={(e) => set("tabla", e.target.value)}
        className="h-9 w-auto min-w-40"
      >
        <option value="">{t("allTables")}</option>
        {AUDIT_TABLES.map((tbl) => (
          <option key={tbl} value={tbl}>
            {t(TABLE_KEY[tbl])}
          </option>
        ))}
      </Select>

      <Select
        aria-label={t("filterAction")}
        value={params.get("accion") ?? ""}
        onChange={(e) => set("accion", e.target.value)}
        className="h-9 w-auto min-w-36"
      >
        <option value="">{t("allActions")}</option>
        {AUDIT_ACTIONS.map((a) => (
          <option key={a} value={a}>
            {t(ACTION_KEY[a])}
          </option>
        ))}
      </Select>
    </div>
  );
}
