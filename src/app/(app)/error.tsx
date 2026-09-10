"use client";

import { useTranslations } from "next-intl";
import { RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("common");

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-danger-bg text-danger">
        <TriangleAlert className="size-5" strokeWidth={1.75} />
      </span>
      <p className="text-sm text-muted">{t("loadError")}</p>
      <Button variant="secondary" size="sm" onClick={reset}>
        <RotateCw className="size-4" />
        {t("retry")}
      </Button>
    </div>
  );
}
