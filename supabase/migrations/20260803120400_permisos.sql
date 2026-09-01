-- ============================================================================
--  AFA MANAGER — Privilegios de tabla
--
--  RLS decide QUÉ FILAS ve cada usuario, pero primero el rol necesita el
--  privilegio de tocar la tabla. Sin estos GRANT, PostgREST responde
--  "permission denied" antes de evaluar una sola política.
--
--  Se otorgan explícitamente en vez de depender de los privilegios por
--  defecto del proyecto, que varían entre Supabase local y hospedado.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
--  authenticated — privilegio amplio; RLS es el filtro real, fila por fila.
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on all tables    in schema public to authenticated;
grant usage, select                  on all sequences in schema public to authenticated;

-- Explícito y no "on all functions": eso también intentaría tocar las funciones
-- de btree_gist y llenaría el log de advertencias inútiles.
grant execute on function
  mi_academia(), mi_rol(), es_admin(), es_director(),
  es_mi_equipo(uuid), es_mi_jugador(uuid), es_mi_hijo(uuid),
  edad_deportiva(date, int), edad_real(date),
  siguiente_codigo_jugador(uuid), preview_renovacion(uuid)
  to authenticated;

-- La bitácora es de solo lectura, incluso para el director.
revoke insert, update, delete on auditoria from authenticated;

-- ----------------------------------------------------------------------------
--  anon — sin acceso a ningún dato.
--  Nadie sin sesión toca información de menores de edad. Falla cerrado:
--  una petición sin autenticar recibe "permission denied", no una lista vacía.
-- ----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;

-- ----------------------------------------------------------------------------
--  Tablas futuras heredan estos privilegios automáticamente.
-- ----------------------------------------------------------------------------
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
