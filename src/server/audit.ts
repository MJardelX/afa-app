import { AUDIT_ACTIONS, AUDIT_TABLES } from "@/components/audit/labels";
import { PAGE_SIZE, rangeFor } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

export { AUDIT_ACTIONS, AUDIT_TABLES };

export type AuditEntry = {
  id: number;
  tabla: string;
  registroId: string | null;
  accion: string;
  usuarioId: string | null;
  usuarioNombre: string | null;
  datosPrevios: Record<string, unknown> | null;
  datosNuevos: Record<string, unknown> | null;
  fecha: string;
};

export type AuditFilters = {
  tabla?: string;
  accion?: string;
  page?: number;
};

/** Paginated audit log — RLS already restricts this to the director. */
export async function listAudit(filters: AuditFilters) {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const [from, to] = rangeFor(page);

  let query = supabase
    .from("auditoria")
    .select(
      "id, tabla, registro_id, accion, usuario_id, datos_previos, datos_nuevos, fecha",
      { count: "exact" },
    )
    .order("fecha", { ascending: false })
    .range(from, to);

  if (filters.tabla) query = query.eq("tabla", filters.tabla);
  if (filters.accion) query = query.eq("accion", filters.accion);

  const { data, count, error } = await query;
  if (error) throw error;

  const userIds = [...new Set((data ?? []).map((r) => r.usuario_id).filter((v): v is string => !!v))];
  const { data: perfiles } = userIds.length
    ? await supabase.from("perfiles").select("id, nombre_completo").in("id", userIds)
    : { data: [] as { id: string; nombre_completo: string }[] };
  const nameById = new Map((perfiles ?? []).map((p) => [p.id, p.nombre_completo]));

  const rows: AuditEntry[] = (data ?? []).map((r) => ({
    id: r.id,
    tabla: r.tabla,
    registroId: r.registro_id,
    accion: r.accion,
    usuarioId: r.usuario_id,
    usuarioNombre: r.usuario_id ? (nameById.get(r.usuario_id) ?? null) : null,
    datosPrevios: r.datos_previos as Record<string, unknown> | null,
    datosNuevos: r.datos_nuevos as Record<string, unknown> | null,
    fecha: r.fecha,
  }));

  return { rows, total: count ?? 0, page, pageSize: PAGE_SIZE };
}
