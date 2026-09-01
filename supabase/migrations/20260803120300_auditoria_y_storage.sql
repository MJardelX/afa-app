-- ============================================================================
--  AFA MANAGER — Auditoría y almacenamiento
-- ============================================================================

-- ============================================================================
--  AUDITORÍA — lo que separa "un Excel" de un sistema institucional
-- ============================================================================

create table auditoria (
  id            bigserial primary key,
  academia_id   uuid,
  tabla         text not null,
  registro_id   uuid,
  accion        text not null,
  usuario_id    uuid,
  datos_previos jsonb,
  datos_nuevos  jsonb,
  fecha         timestamptz not null default now()
);

create index auditoria_registro_idx on auditoria (tabla, registro_id, fecha desc);
create index auditoria_usuario_idx  on auditoria (usuario_id, fecha desc);

create or replace function fn_auditoria()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_academia uuid;
begin
  if tg_op = 'DELETE' then
    begin v_academia := (to_jsonb(old) ->> 'academia_id')::uuid; exception when others then v_academia := null; end;
    insert into auditoria (academia_id, tabla, registro_id, accion, usuario_id, datos_previos)
    values (v_academia, tg_table_name, (to_jsonb(old) ->> 'id')::uuid, tg_op, auth.uid(), to_jsonb(old));
    return old;
  else
    begin v_academia := (to_jsonb(new) ->> 'academia_id')::uuid; exception when others then v_academia := null; end;
    insert into auditoria (academia_id, tabla, registro_id, accion, usuario_id, datos_previos, datos_nuevos)
    values (
      v_academia, tg_table_name, (to_jsonb(new) ->> 'id')::uuid, tg_op, auth.uid(),
      case when tg_op = 'UPDATE' then to_jsonb(old) end,
      to_jsonb(new)
    );
    return new;
  end if;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'jugadores','fichas_medicas','inscripciones','tutores',
    'equipos','temporadas','evaluaciones','perfiles'
  ] loop
    execute format(
      'create trigger tg_auditoria_%s after insert or update or delete on %I
         for each row execute function fn_auditoria()', t, t);
  end loop;
end $$;

alter table auditoria enable row level security;

-- Solo el director consulta la bitácora. Nadie la escribe ni la borra a mano.
create policy auditoria_lectura on auditoria
  for select using (academia_id = mi_academia() and es_director());

-- ============================================================================
--  STORAGE — fotos de jugadores y documentos
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('fotos', 'fotos', false, 5242880,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('documentos', 'documentos', false, 10485760,
   array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

-- Fotos: las ve cualquier usuario autenticado de la academia; solo admin sube.
create policy fotos_lectura on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = mi_academia()::text);

create policy fotos_escritura on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = mi_academia()::text
    and es_admin()
  );

create policy fotos_actualiza on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = mi_academia()::text and es_admin());

create policy fotos_borra on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = mi_academia()::text and es_admin());

-- Documentos (partidas, DPI, fichas firmadas): solo director y coordinador.
create policy documentos_admin on storage.objects
  for all to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = mi_academia()::text
    and es_admin()
  )
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = mi_academia()::text
    and es_admin()
  );

comment on table auditoria is
  'Convención de rutas en Storage: {academia_id}/{jugador_id}/{archivo}. '
  'El primer segmento es lo que aísla a cada academia.';
