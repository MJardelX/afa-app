-- ============================================================================
--  Entrenamiento por CATEGORÍA, no por equipo.
--
--  Los chicos entrenan agrupados por edad, no por plantilla de convocatoria:
--  "Sub-10 A" y un futuro "Sub-10 B" entrenan juntos. El horario semanal se
--  mueve de equipos a categorías; las sesiones de entrenamiento pasan a
--  colgar de categoria_id (equipo_id queda null). Los partidos/amistosos/
--  torneos siguen siendo de un equipo específico (rival, marcador, plantilla).
-- ============================================================================

-- ── Horario semanal: de equipos a categorías ────────────────────────────────

alter table categorias add column if not exists dias_entreno text[];
alter table categorias add column if not exists hora_entreno time;
alter table categorias add column if not exists lugar_entreno text;

-- Punto de partida: el patrón del equipo más antiguo de cada categoría (el
-- seed trae un equipo por categoría, así que esto no pierde nada ahí).
update categorias c
set dias_entreno = e.dias_entreno,
    hora_entreno = e.hora_entreno,
    lugar_entreno = e.lugar_entreno
from (
  select distinct on (categoria_id) categoria_id, dias_entreno, hora_entreno, lugar_entreno
  from equipos
  where dias_entreno is not null
  order by categoria_id, creado_en
) e
where e.categoria_id = c.id;

alter table equipos drop column if exists dias_entreno;
alter table equipos drop column if exists hora_entreno;
alter table equipos drop column if exists lugar_entreno;

-- ── Sesiones: entrenamiento → categoria_id; partido/amistoso/torneo → equipo_id ─

alter table sesiones add column if not exists categoria_id uuid
  references categorias(id) on delete restrict;

alter table sesiones alter column equipo_id drop not null;

alter table sesiones add constraint sesion_referencia_valida check (
  (tipo = 'entrenamiento' and categoria_id is not null and equipo_id is null)
  or (tipo <> 'entrenamiento' and equipo_id is not null)
);

create index if not exists sesiones_categoria_fecha_idx on sesiones (categoria_id, fecha desc);

-- ── Guarda de coherencia: ahora también deriva de categoria_id ──────────────
--  Un entrenamiento no tiene equipo del que heredar temporada_id (las
--  categorías son un catálogo permanente, no viven por temporada) — para ese
--  caso se confía en el temporada_id que manda la app (la temporada activa).

create or replace function fn_validar_sesion()
returns trigger language plpgsql as $$
declare
  v_temporada uuid;
  v_academia  uuid;
begin
  if new.equipo_id is not null then
    select temporada_id, academia_id into v_temporada, v_academia
      from equipos where id = new.equipo_id;
    new.temporada_id := v_temporada;
    new.academia_id  := v_academia;
  elsif new.categoria_id is not null then
    select academia_id into v_academia from categorias where id = new.categoria_id;
    new.academia_id := v_academia;
  end if;
  return new;
end;
$$;

drop trigger if exists tg_sesion_coherente on sesiones;
create trigger tg_sesion_coherente
  before insert or update of equipo_id, categoria_id on sesiones
  for each row execute function fn_validar_sesion();

-- ── Guarda de asistencia: inscrito en el EQUIPO (partidos) o en la
--    CATEGORÍA de su equipo (entrenamientos) ────────────────────────────────

create or replace function fn_validar_asistencia()
returns trigger language plpgsql as $$
declare
  v_ok boolean;
begin
  select exists (
    select 1
      from sesiones s
      join inscripciones i
        on i.jugador_id = new.jugador_id
       and i.estado = 'activa'
       and s.fecha >= i.fecha_alta
       and (i.fecha_baja is null or s.fecha <= i.fecha_baja)
      left join equipos eq on eq.id = i.equipo_id
     where s.id = new.sesion_id
       and (
         (s.equipo_id is not null and s.equipo_id = i.equipo_id)
         or (s.categoria_id is not null and eq.categoria_id = s.categoria_id)
       )
  ) into v_ok;

  if not v_ok then
    raise exception
      'El jugador no está inscrito en el equipo o la categoría de esta sesión en esa fecha';
  end if;

  return new;
end;
$$;

-- ── v_asistencia_jugador: contar también los entrenamientos por categoría ───

create or replace view v_asistencia_jugador
with (security_invoker = on) as
select
  i.jugador_id,
  i.temporada_id,
  i.equipo_id,
  count(*)                                                        as sesiones_convocadas,
  count(*) filter (where s.tipo = 'entrenamiento')                as entrenamientos,
  count(*) filter (where s.tipo <> 'entrenamiento')               as partidos,
  count(*) filter (where a.estado = 'presente')                   as presentes,
  count(*) filter (where a.estado = 'tarde')                      as tardes,
  count(*) filter (where a.estado = 'justificado')                as justificados,
  count(*) filter (where a.estado = 'ausente' or a.estado is null) as ausentes,
  coalesce(sum(a.goles), 0)                                       as goles,
  coalesce(sum(a.minutos_jugados), 0)                             as minutos,
  round(
    100.0 * count(*) filter (where a.estado in ('presente', 'tarde'))
    / nullif(count(*), 0)
  , 1)                                                            as porcentaje
from inscripciones i
left join equipos eq on eq.id = i.equipo_id
join sesiones s
  on (
    (s.equipo_id is not null and s.equipo_id = i.equipo_id)
    or (s.categoria_id is not null and s.categoria_id = eq.categoria_id)
  )
 and s.estado = 'realizada'
 and s.fecha >= i.fecha_alta
 and (i.fecha_baja is null or s.fecha <= i.fecha_baja)
left join asistencias a
  on a.sesion_id = s.id and a.jugador_id = i.jugador_id
where i.estado = 'activa'
group by i.jugador_id, i.temporada_id, i.equipo_id;

comment on view v_asistencia_jugador is
  'El porcentaje se calcula solo sobre las sesiones posteriores al alta del jugador: '
  'quien entra en octubre no queda castigado por las sesiones de marzo. Entrenamientos '
  'cuentan por categoría (todo el equipo de esa edad comparte sesión); partidos por equipo.';

-- ── RLS: un entrenador también puede ver/gestionar sesiones de la
--    categoría de CUALQUIERA de sus equipos (temporada activa) ─────────────

create or replace function es_mi_categoria(p_categoria uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from equipos e
    join temporadas t on t.id = e.temporada_id and t.activa
     where e.categoria_id = p_categoria
       and (e.entrenador_id = auth.uid() or e.auxiliar_id = auth.uid())
  );
$$;

drop policy if exists sesion_lectura on sesiones;
create policy sesion_lectura on sesiones
  for select using (
    academia_id = mi_academia()
    and (
      es_admin()
      or (equipo_id is not null and es_mi_equipo(equipo_id))
      or (categoria_id is not null and es_mi_categoria(categoria_id))
      or exists (
        select 1 from inscripciones i
        join equipos e on e.id = i.equipo_id
         where es_mi_hijo(i.jugador_id)
           and (
             (sesiones.equipo_id is not null and i.equipo_id = sesiones.equipo_id)
             or (sesiones.categoria_id is not null and e.categoria_id = sesiones.categoria_id)
           )
      )
    )
  );

drop policy if exists sesion_escritura on sesiones;
create policy sesion_escritura on sesiones
  for all using (
    academia_id = mi_academia()
    and (
      es_admin()
      or (equipo_id is not null and es_mi_equipo(equipo_id))
      or (categoria_id is not null and es_mi_categoria(categoria_id))
    )
  ) with check (
    academia_id = mi_academia()
    and (
      es_admin()
      or (equipo_id is not null and es_mi_equipo(equipo_id))
      or (categoria_id is not null and es_mi_categoria(categoria_id))
    )
  );

drop policy if exists asistencia_lectura on asistencias;
create policy asistencia_lectura on asistencias
  for select using (
    exists (
      select 1 from sesiones s
       where s.id = sesion_id
         and s.academia_id = mi_academia()
         and (
           es_admin()
           or (s.equipo_id is not null and es_mi_equipo(s.equipo_id))
           or (s.categoria_id is not null and es_mi_categoria(s.categoria_id))
           or es_mi_hijo(asistencias.jugador_id)
         )
    )
  );

drop policy if exists asistencia_escritura on asistencias;
create policy asistencia_escritura on asistencias
  for all using (
    exists (
      select 1 from sesiones s
       where s.id = sesion_id and s.academia_id = mi_academia()
         and (
           es_admin()
           or (s.equipo_id is not null and es_mi_equipo(s.equipo_id))
           or (s.categoria_id is not null and es_mi_categoria(s.categoria_id))
         )
    )
  ) with check (
    exists (
      select 1 from sesiones s
       where s.id = sesion_id and s.academia_id = mi_academia()
         and (
           es_admin()
           or (s.equipo_id is not null and es_mi_equipo(s.equipo_id))
           or (s.categoria_id is not null and es_mi_categoria(s.categoria_id))
         )
    )
  );
