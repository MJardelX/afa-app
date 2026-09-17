"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { useTranslations } from "next-intl";

import { Select } from "@/components/ui/field";

export function PeriodSelect({
  periods,
  selectedId,
}: {
  periods: { id: string; nombre: string }[];
  selectedId: string;
}) {
  const t = useTranslations("evaluation");
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">{t("periodLabel")}</span>
      <Select
        value={selectedId}
        onChange={(e) => router.push(`${pathname}?period=${e.target.value}`)}
        className="h-9 w-auto text-sm"
      >
        {periods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </Select>
    </label>
  );
}
