-- ============================================================================
--  AFA MANAGER — La categoría de la inscripción es INDEPENDIENTE del equipo.
--
--  Los entrenamientos son por CATEGORÍA, no por equipo. Hasta ahora la
--  categoría "real" de un jugador se forzaba a la de su equipo (el trigger
--  sobrescribía `inscripciones.categoria_id`), y la asistencia a entrenamientos
--  derivaba la categoría del jugador de `equipos.categoria_id` — así que un
--  jugador inscrito en una categoría pero sin equipo no aparecía en ninguna
--  sesión de entrenamiento.
--
--  Ahora:
--    · `inscripciones.categoria_id` = categoría de entrenamiento del jugador
--      esta temporada. Fija, editable, independiente del equipo.
--    · El equipo solo se usa como valor por defecto cuando no se dio categoría.
--    · "Categoría efectiva" en asistencia = coalesce(i.categoria_id, eq.categoria_id).
-- ============================================================================

-- ── 1. El trigger deja de forzar: solo rellena cuando viene null ─────────────

create or replace function fn_inscripcion_categoria()
returns trigger language plpgsql as $$
begin
  -- La categoría de la inscripción es independiente del equipo. Solo se
  -- rellena desde el equipo como comodidad cuando no se indicó ninguna.
  if new.categoria_id is null and new.equipo_id is not null then
    select categoria_id into new.categoria_id
      from equipos where id = new.equipo_id;
  end if;
  return new;
end;
$$;

-- El trigger tg_inscripcion_categoria ya existe (before insert or update of
-- equipo_id, categoria_id) — CREATE OR REPLACE FUNCTION conserva el binding.

-- ── 2. Backfill: inscripciones sin categoría → la que corresponde por edad ───

update inscripciones i
   set categoria_id = c.id
  from jugadores j, temporadas t, categorias c
 where i.categoria_id is null
   and j.id = i.jugador_id
   and t.id = i.temporada_id
   and c.academia_id = j.academia_id
   and c.activa
   and edad_deportiva(j.fecha_nacimiento, t.anio) between c.edad_min and c.edad_max;

-- ── 3. Guarda de asistencia: categoría efectiva de la inscripción ───────────

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
         or (s.categoria_id is not null
             and coalesce(i.categoria_id, eq.categoria_id) = s.categoria_id)
       )
  ) into v_ok;

  if not v_ok then
    raise exception
      'El jugador no está inscrito en el equipo o la categoría de esta sesión en esa fecha';
  end if;

  return new;
end;
$$;

-- ── 4. v_asistencia_jugador: entrenamientos por categoría efectiva ──────────
--  (misma lista de columnas — CREATE OR REPLACE VIEW no permite reordenarlas;
--   solo cambia la condición del join a sesiones.)

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
    or (s.categoria_id is not null
        and s.categoria_id = coalesce(i.categoria_id, eq.categoria_id))
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
  'cuentan por la categoría de la inscripción (o la del equipo si no hay); partidos por equipo.';

-- ── 5. RLS: el tutor (portal futuro) ve la sesión de entrenamiento de la
--    categoría de su hijo aunque el hijo no tenga equipo ──────────────────────

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

-- ── 6. v_jugadores: exponer la categoría del equipo y si difiere de la
--    categoría de entrenamiento (para el aviso "entrena en X, juega con Y") ───
--    Columnas nuevas AL FINAL (CREATE OR REPLACE VIEW no permite insertarlas
--    en medio).

create or replace view v_jugadores
with (security_invoker = on) as
select
  j.id,
  j.academia_id,
  j.codigo,
  j.nombres,
  j.apellidos,
  j.nombres || ' ' || j.apellidos            as nombre_completo,
  j.fecha_nacimiento,
  j.foto_url,
  j.colegio,
  j.direccion,
  j.fecha_ingreso,
  j.estado,
  j.autoriza_uso_imagen,

  t.id   as temporada_id,
  t.nombre as temporada,
  t.anio,

  edad_real(j.fecha_nacimiento)                     as edad_real,
  edad_deportiva(j.fecha_nacimiento, t.anio)        as edad_deportiva,

  ce.id     as categoria_por_edad_id,
  ce.nombre as categoria_por_edad,

  cj.id     as categoria_id,
  cj.nombre as categoria,
  e.id      as equipo_id,
  e.nombre  as equipo,
  e.entrenador_id,
  i.id      as inscripcion_id,
  i.numero_camiseta,
  i.posicion,
  i.motivo_excepcion,

  (cj.id is not null and cj.id is distinct from ce.id) as fuera_de_categoria,
  (i.id is null)                                       as sin_inscribir,
  (i.id is not null and i.equipo_id is null)           as sin_equipo,

  -- La categoría del equipo (si tiene) y si difiere de la de entrenamiento
  ec.nombre as equipo_categoria,
  (e.id is not null
   and e.categoria_id is distinct from coalesce(i.categoria_id, e.categoria_id))
    as equipo_categoria_distinta

from jugadores j
join temporadas t
  on t.academia_id = j.academia_id and t.activa
left join categorias ce
  on ce.academia_id = j.academia_id
 and ce.activa
 and edad_deportiva(j.fecha_nacimiento, t.anio) between ce.edad_min and ce.edad_max
left join inscripciones i
  on i.jugador_id = j.id and i.temporada_id = t.id
 and i.es_principal and i.estado = 'activa'
left join equipos    e  on e.id  = i.equipo_id
left join categorias cj on cj.id = coalesce(i.categoria_id, e.categoria_id)
left join categorias ec on ec.id = e.categoria_id;

comment on view v_jugadores is
  'Jugadores de la temporada activa con su categoría calculada. Consultar como tabla.';
