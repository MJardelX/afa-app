-- ============================================================================
--  AFA MANAGER — cualquier miembro del staff toma asistencia
--
--  Antes solo el entrenador/auxiliar de la categoría (o del equipo, en
--  partidos) y los admins podían ver una sesión y marcar su asistencia. La
--  academia quiere que cualquier rol de staff (director, coordinador,
--  entrenador) pueda tomarla en cualquier sesión — p. ej. cuando un
--  entrenador cubre a otro.
--
--  Alcance: ver sesiones + asistencia, marcar asistencia, y pasar la sesión
--  entre 'programada' y 'realizada' (cerrar / reabrir). Crear, editar,
--  suspender, cancelar y borrar sesiones sigue siendo de quien la gestiona
--  (sesion_escritura, sin cambios). La app aplica la misma regla
--  (src/server/attendance.ts → canTakeAttendance).
--
--  El rol 'tutor' (portal de padres, futuro) queda fuera.
-- ============================================================================

create or replace function es_staff()
returns boolean
language sql stable
as $$ select mi_rol() in ('director', 'coordinador', 'entrenador') $$;

-- ── Sesiones: lectura para todo el staff ────────────────────────────────────

drop policy if exists sesion_lectura on sesiones;
create policy sesion_lectura on sesiones
  for select using (
    academia_id = mi_academia()
    and (
      es_staff()
      or exists (
        select 1 from inscripciones i
        left join equipos e on e.id = i.equipo_id
         where es_mi_hijo(i.jugador_id)
           and (
             (sesiones.equipo_id is not null and i.equipo_id = sesiones.equipo_id)
             or (sesiones.categoria_id is not null
                 and coalesce(i.categoria_id, e.categoria_id) = sesiones.categoria_id)
           )
      )
    )
  );

-- ── Sesiones: cerrar / reabrir para todo el staff ───────────────────────────
--  Política adicional (se suma con OR a sesion_escritura): solo UPDATE, y
--  solo entre 'programada' y 'realizada'. El trigger de abajo impide que por
--  esta vía se toque cualquier otra columna.

drop policy if exists sesion_cierre_staff on sesiones;
create policy sesion_cierre_staff on sesiones
  for update using (
    academia_id = mi_academia() and es_staff()
    and estado in ('programada', 'realizada')
  ) with check (
    academia_id = mi_academia() and es_staff()
    and estado in ('programada', 'realizada')
  );

create or replace function fn_sesion_cierre_staff()
returns trigger language plpgsql as $$
begin
  -- Quien gestiona la sesión puede cambiar lo que quiera.
  if es_admin()
     or (new.equipo_id is not null and es_mi_equipo(new.equipo_id))
     or (new.categoria_id is not null and es_mi_categoria(new.categoria_id))
     or auth.uid() is null  -- service role / migraciones
  then
    return new;
  end if;

  -- El resto del staff solo puede cambiar el estado.
  if (to_jsonb(new) - 'estado' - 'updated_at')
     is distinct from (to_jsonb(old) - 'estado' - 'updated_at') then
    raise exception 'Solo puedes cerrar o reabrir esta sesión'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists tg_sesion_cierre_staff on sesiones;
create trigger tg_sesion_cierre_staff
  before update on sesiones
  for each row execute function fn_sesion_cierre_staff();

-- ── Asistencias: lectura y escritura para todo el staff ─────────────────────

drop policy if exists asistencia_lectura on asistencias;
create policy asistencia_lectura on asistencias
  for select using (
    exists (
      select 1 from sesiones s
       where s.id = sesion_id
         and s.academia_id = mi_academia()
         and (es_staff() or es_mi_hijo(asistencias.jugador_id))
    )
  );

drop policy if exists asistencia_escritura on asistencias;
create policy asistencia_escritura on asistencias
  for all using (
    exists (
      select 1 from sesiones s
       where s.id = sesion_id and s.academia_id = mi_academia() and es_staff()
    )
  ) with check (
    exists (
      select 1 from sesiones s
       where s.id = sesion_id and s.academia_id = mi_academia() and es_staff()
    )
  );
