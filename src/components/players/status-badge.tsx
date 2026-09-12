import { useTranslations } from "next-intl";

import { Badge, type BadgeTone } from "@/components/ui/badge";

const TONE: Record<string, BadgeTone> = {
  activo: "good",
  inactivo: "neutral",
  retirado: "danger",
  egresado: "brand",
};

const KEY: Record<string, string> = {
  activo: "statusActivo",
  inactivo: "statusInactivo",
  retirado: "statusRetirado",
  egresado: "statusEgresado",
};

export function PlayerStatusBadge({ estado }: { estado: string }) {
  const t = useTranslations("players");
  return (
    <Badge tone={TONE[estado] ?? "neutral"}>
      {t.has(KEY[estado] ?? "") ? t(KEY[estado]) : estado}
    </Badge>
  );
}
