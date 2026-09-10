import { getLocale, getTranslations } from "next-intl/server";
import { History } from "lucide-react";

import { AuditFilters } from "@/components/audit/audit-filters";
import { AuditList } from "@/components/audit/audit-list";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { parsePage } from "@/lib/pagination";
import { listAudit } from "@/server/audit";
import { currentProfile } from "@/server/players";

export async function generateMetadata() {
  const t = await getTranslations("audit");
  return { title: t("metaTitle") };
}

function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("audit");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const sp = await searchParams;

  const profile = await currentProfile();
  if (profile?.rol !== "director") {
    return (
      <p className="rounded-lg bg-surface-2 px-3 py-6 text-center text-sm text-muted">
        {t("directorOnly")}
      </p>
    );
  }

  const tabla = str(sp.tabla);
  const accion = str(sp.accion);
  const page = parsePage(sp.page);

  const { rows, total, pageSize } = await listAudit({ tabla, accion, page });

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} description={t("description")} />
      <AuditFilters />

      {rows.length === 0 ? (
        <EmptyState icon={<History strokeWidth={1.5} />} title={t("empty")} />
      ) : (
        <div className="space-y-3">
          <Card>
            <AuditList rows={rows} locale={locale} />
          </Card>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            searchParams={{ tabla, accion }}
            labelRange={(from, to, tot) => tc("range", { from, to, total: tot })}
          />
        </div>
      )}
    </div>
  );
}
