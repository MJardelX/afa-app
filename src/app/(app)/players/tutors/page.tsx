import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Contact, Plus } from "lucide-react";

import { PlayersNav } from "@/components/players/players-nav";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { DataTable, Td, Th, Tr } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { currentProfile, isAdmin } from "@/server/players";
import { listTutors } from "@/server/tutors";

export async function generateMetadata() {
  const t = await getTranslations("tutors");
  return { title: t("metaTitle") };
}

function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("tutors");
  const tc = await getTranslations("common");
  const sp = await searchParams;
  const q = str(sp.q);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const [{ rows, total, pageSize }, profile] = await Promise.all([
    listTutors({ q, page }),
    currentProfile(),
  ]);
  const admin = isAdmin(profile?.rol);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          admin ? (
            <Link href="/players/tutors/new" className={buttonClasses("primary", "md")}>
              <Plus className="size-4" />
              {t("new")}
            </Link>
          ) : undefined
        }
      />

      <PlayersNav />

      <SearchInput placeholder={t("searchPlaceholder")} />

      {rows.length === 0 ? (
        <EmptyState
          icon={<Contact strokeWidth={1.5} />}
          title={q ? t("emptySearch") : t("empty")}
          hint={q ? undefined : t("emptyHint")}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            {tc("range", {
              from: (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, total),
              total,
            })}
          </p>

          <DataTable>
            <thead>
              <Tr head>
                <Th>{t("colName")}</Th>
                <Th>{t("colPhone")}</Th>
                <Th align="right">{t("colChildren")}</Th>
              </Tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.id}>
                  <Td className="py-2.5">
                    <Link
                      href={`/players/tutors/${r.id}`}
                      className="group flex items-center gap-3 font-medium"
                    >
                      <Avatar name={`${r.nombres} ${r.apellidos}`} size="sm" />
                      <span className="truncate group-hover:text-brand-legible">
                        {r.nombres} {r.apellidos}
                      </span>
                    </Link>
                  </Td>
                  <Td className="tabular-nums text-muted">
                    {r.telefono ?? "—"}
                  </Td>
                  <Td className="text-right">
                    {r.children > 0 ? (
                      <Badge tone="neutral">
                        {t("childCount", { count: r.children })}
                      </Badge>
                    ) : (
                      <span className="text-xs text-faint">
                        {t("noChildren")}
                      </span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            searchParams={{ q }}
            labelRange={(from, to, tot) => tc("range", { from, to, total: tot })}
          />
        </div>
      )}
    </div>
  );
}
