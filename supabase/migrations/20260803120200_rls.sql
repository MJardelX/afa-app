-- ============================================================================
--  AFA MANAGER — Seguridad a nivel de fila (RLS)
--  Datos de menores de edad: el aislamiento es un requisito, no un extra.
-- ============================================================================

-- ============================================================================
--  HELPERS
--  SECURITY DEFINER para que no recursen contra las políticas de `perfiles`.
-- ============================================================================

create or replace function mi_academia()
returns uuid
language sql stable security definer set search_path = public
as $$ select academia_id from perfiles where id = auth.uid() and activo $$;

create or replace function mi_rol()
returns rol_usuario
language sql stable security definer set search_path = public
as $$ select rol from perfiles where id = auth.uid() and activo $$;

-- Director y coordinador ven todo lo de su academia.
create or replace function es_admin()
returns boolean
language sql stable
as $$ select mi_rol() in ('director', 'coordinador') $$;

create or replace function es_director()
returns boolean
language sql stable
as $$ select mi_rol() = 'director' $$;

-- El entrenador solo opera sobre los equipos que tiene asignados.
create or replace function es_mi_equipo(p_equipo uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from equipos
     where id = p_equipo
       and (entrenador_id = auth.uid() or auxiliar_id = auth.uid())
  );
$$;

-- Jugadores de los equipos del entrenador (temporada activa).
create or replace function es_mi_jugador(p_jugador uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from inscripciones i
      join equipos e on e.id = i.equipo_id
      join temporadas t on t.id = i.temporada_id and t.activa
     where i.jugador_id = p_jugador
       and i.estado = 'activa'
       and (e.entrenador_id = auth.uid() or e.auxiliar_id = auth.uid())
  );
$$;

-- Portal de padres (v2.0): el tutor solo ve a sus hijos.
create or replace function es_mi_hijo(p_jugador uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from jugador_tutor jt
      join tutores tu on tu.id = jt.tutor_id
     where jt.jugador_id = p_jugador
       and tu.perfil_id = auth.uid()
  );
$$;

-- ============================================================================
--  ALTA AUTOMÁTICA DE PERFIL AL REGISTRARSE
-- ============================================================================

--  El perfil nace ACTIVO solo si el usuario fue creado por la dirección, es
--  decir si trae `rol` en el metadata (vía Admin API o invitación).
--
--  Quien llegue por cualquier otra vía nace INACTIVO. Como mi_academia() y
--  mi_rol() filtran por `activo`, un perfil inactivo devuelve NULL y no pasa
--  ninguna política: no ve un solo jugador. Sin esto, cualquiera que se
--  registrara quedaría como entrenador con acceso al expediente de 200 menores.

create or replace function fn_nuevo_usuario()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_academia   uuid;
  v_rol_meta   text := nullif(new.raw_user_meta_data ->> 'rol', '');
  v_creado_por_direccion boolean := v_rol_meta is not null;
begin
  v_academia := nullif(new.raw_user_meta_data ->> 'academia_id', '')::uuid;

  -- Si no viene en el metadata y solo existe una academia, se usa esa.
  if v_academia is null and (select count(*) from academias where activa) = 1 then
    select id into v_academia from academias where activa;
  end if;

  if v_academia is null then
    return new;  -- sin academia no hay perfil; la dirección lo asignará
  end if;

  insert into perfiles (id, academia_id, nombre_completo, rol, activo)
  values (
    new.id,
    v_academia,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', split_part(new.email, '@', 1)),
    coalesce(v_rol_meta::rol_usuario, 'entrenador'),
    v_creado_por_direccion
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger tg_nuevo_usuario
  after insert on auth.users
  for each row execute function fn_nuevo_usuario();

-- ============================================================================
--  ACTIVAR RLS EN TODAS LAS TABLAS
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'academias','perfiles','temporadas','categorias','equipos',
    'jugadores','fichas_medicas','tutores','jugador_tutor','inscripciones',
    'sesiones','asistencias','periodos_evaluacion','criterios_evaluacion',
    'evaluaciones','evaluacion_detalle','documentos','correlativos'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ============================================================================
--  ACADEMIA Y PERFILES
-- ============================================================================

create policy academia_lectura on academias
  for select using (id = mi_academia());

create policy academia_edicion on academias
  for update using (id = mi_academia() and es_director());

create policy perfil_propio on perfiles
  for select using (id = auth.uid() or academia_id = mi_academia());

create policy perfil_actualiza_propio on perfiles
  for update using (id = auth.uid()) with check (id = auth.uid() and rol = mi_rol());

create policy perfil_admin on perfiles
  for all using (academia_id = mi_academia() and es_director())
  with check (academia_id = mi_academia() and es_director());

-- ============================================================================
--  CATÁLOGOS — todos leen, solo admin escribe
-- ============================================================================

create policy temporada_lectura on temporadas
  for select using (academia_id = mi_academia());
create policy temporada_escritura on temporadas
  for all using (academia_id = mi_academia() and es_admin())
  with check (academia_id = mi_academia() and es_admin());

create policy categoria_lectura on categorias
  for select using (academia_id = mi_academia());
create policy categoria_escritura on categorias
  for all using (academia_id = mi_academia() and es_admin())
  with check (academia_id = mi_academia() and es_admin());

create policy equipo_lectura on equipos
  for select using (academia_id = mi_academia());
create policy equipo_escritura on equipos
  for all using (academia_id = mi_academia() and es_admin())
  with check (academia_id = mi_academia() and es_admin());

create policy criterio_lectura on criterios_evaluacion
  for select using (academia_id = mi_academia());
create policy criterio_escritura on criterios_evaluacion
  for all using (academia_id = mi_academia() and es_admin())
  with check (academia_id = mi_academia() and es_admin());

create policy periodo_lectura on periodos_evaluacion
  for select using (
    exists (select 1 from temporadas t
             where t.id = temporada_id and t.academia_id = mi_academia())
  );
create policy periodo_escritura on periodos_evaluacion
  for all using (
    es_admin() and exists (select 1 from temporadas t
             where t.id = temporada_id and t.academia_id = mi_academia())
  ) with check (
    es_admin() and exists (select 1 from temporadas t
             where t.id = temporada_id and t.academia_id = mi_academia())
  );

-- ============================================================================
--  JUGADORES
-- ============================================================================

create policy jugador_lectura on jugadores
  for select using (
    academia_id = mi_academia()
    and (es_admin() or mi_rol() = 'entrenador' or es_mi_hijo(id))
  );

create policy jugador_escritura_admin on jugadores
  for all using (academia_id = mi_academia() and es_admin())
  with check (academia_id = mi_academia() and es_admin());

-- ----------------------------------------------------------------------------
--  FICHA MÉDICA — el dato más sensible del sistema.
--  El entrenador NO la ve. Solo director y coordinador, y el tutor de su hijo.
-- ----------------------------------------------------------------------------

create policy ficha_lectura on fichas_medicas
  for select using (
    exists (
      select 1 from jugadores j
       where j.id = jugador_id
         and j.academia_id = mi_academia()
         and (es_admin() or es_mi_hijo(j.id))
    )
  );

create policy ficha_escritura on fichas_medicas
  for all using (
    es_admin() and exists (
      select 1 from jugadores j where j.id = jugador_id and j.academia_id = mi_academia()
    )
  ) with check (
    es_admin() and exists (
      select 1 from jugadores j where j.id = jugador_id and j.academia_id = mi_academia()
    )
  );

-- ============================================================================
--  TUTORES
-- ============================================================================

create policy tutor_lectura on tutores
  for select using (
    academia_id = mi_academia() and (es_admin() or mi_rol() = 'entrenador' or perfil_id = auth.uid())
  );

create policy tutor_escritura on tutores
  for all using (academia_id = mi_academia() and es_admin())
  with check (academia_id = mi_academia() and es_admin());

create policy jugador_tutor_lectura on jugador_tutor
  for select using (
    exists (select 1 from jugadores j where j.id = jugador_id and j.academia_id = mi_academia())
  );

create policy jugador_tutor_escritura on jugador_tutor
  for all using (
    es_admin() and exists (
      select 1 from jugadores j where j.id = jugador_id and j.academia_id = mi_academia())
  ) with check (
    es_admin() and exists (
      select 1 from jugadores j where j.id = jugador_id and j.academia_id = mi_academia())
  );

-- ============================================================================
--  INSCRIPCIONES
-- ============================================================================

create policy inscripcion_lectura on inscripciones
  for select using (
    exists (
      select 1 from jugadores j
       where j.id = jugador_id
         and j.academia_id = mi_academia()
         and (es_admin() or mi_rol() = 'entrenador' or es_mi_hijo(j.id))
    )
  );

create policy inscripcion_escritura on inscripciones
  for all using (
    es_admin() and exists (
      select 1 from jugadores j where j.id = jugador_id and j.academia_id = mi_academia())
  ) with check (
    es_admin() and exists (
      select 1 from jugadores j where j.id = jugador_id and j.academia_id = mi_academia())
  );

-- ============================================================================
--  SESIONES Y ASISTENCIA — donde el entrenador sí trabaja
-- ============================================================================

create policy sesion_lectura on sesiones
  for select using (
    academia_id = mi_academia()
    and (es_admin() or es_mi_equipo(equipo_id)
         or exists (select 1 from inscripciones i
                     where i.equipo_id = sesiones.equipo_id and es_mi_hijo(i.jugador_id)))
  );

create policy sesion_escritura on sesiones
  for all using (academia_id = mi_academia() and (es_admin() or es_mi_equipo(equipo_id)))
  with check (academia_id = mi_academia() and (es_admin() or es_mi_equipo(equipo_id)));

create policy asistencia_lectura on asistencias
  for select using (
    exists (
      select 1 from sesiones s
       where s.id = sesion_id
         and s.academia_id = mi_academia()
         and (es_admin() or es_mi_equipo(s.equipo_id) or es_mi_hijo(asistencias.jugador_id))
    )
  );

create policy asistencia_escritura on asistencias
  for all using (
    exists (select 1 from sesiones s
             where s.id = sesion_id and s.academia_id = mi_academia()
               and (es_admin() or es_mi_equipo(s.equipo_id)))
  ) with check (
    exists (select 1 from sesiones s
             where s.id = sesion_id and s.academia_id = mi_academia()
               and (es_admin() or es_mi_equipo(s.equipo_id)))
  );

-- ============================================================================
--  EVALUACIONES
-- ============================================================================

create policy evaluacion_lectura on evaluaciones
  for select using (
    exists (
      select 1 from jugadores j
       where j.id = jugador_id
         and j.academia_id = mi_academia()
         and (es_admin() or es_mi_jugador(j.id)
              or (es_mi_hijo(j.id) and evaluaciones.estado = 'finalizada'))
    )
  );

create policy evaluacion_escritura on evaluaciones
  for all using (
    (es_admin() or (evaluador_id = auth.uid() and es_mi_jugador(jugador_id)))
    and exists (select 1 from jugadores j
                 where j.id = jugador_id and j.academia_id = mi_academia())
  ) with check (
    (es_admin() or (evaluador_id = auth.uid() and es_mi_jugador(jugador_id)))
    and exists (select 1 from jugadores j
                 where j.id = jugador_id and j.academia_id = mi_academia())
  );

create policy detalle_lectura on evaluacion_detalle
  for select using (
    exists (select 1 from evaluaciones e where e.id = evaluacion_id)
  );

create policy detalle_escritura on evaluacion_detalle
  for all using (
    exists (select 1 from evaluaciones e
             where e.id = evaluacion_id
               and (es_admin() or e.evaluador_id = auth.uid())
               and e.estado = 'borrador')
  ) with check (
    exists (select 1 from evaluaciones e
             where e.id = evaluacion_id
               and (es_admin() or e.evaluador_id = auth.uid())
               and e.estado = 'borrador')
  );

-- ============================================================================
--  DOCUMENTOS Y CORRELATIVOS
-- ============================================================================

create policy documento_lectura on documentos
  for select using (
    academia_id = mi_academia() and (es_admin() or es_mi_hijo(jugador_id))
  );

create policy documento_escritura on documentos
  for all using (academia_id = mi_academia() and es_admin())
  with check (academia_id = mi_academia() and es_admin());

-- Solo lo toca la función siguiente_codigo_jugador().
create policy correlativo_uso on correlativos
  for all using (academia_id = mi_academia()) with check (academia_id = mi_academia());
