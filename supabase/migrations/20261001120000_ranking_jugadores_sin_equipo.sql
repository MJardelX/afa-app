-- ============================================================================
--  v_ranking_equipo venía con `join equipos`/`join categorias … on e.categoria_id`,
--  así que cualquier jugador sin equipo (categoría independiente del equipo,
--  ver 20260909130000_categoria_independiente_del_equipo.sql) desaparecía por
--  completo de la vista — y con él, del dashboard y del reporte de asistencia,
--  aunque v_asistencia_jugador sí traía su porcentaje calculado correctamente.
--
--  Arreglo en dos pasos:
--   1. v_asistencia_jugador expone la categoría EFECTIVA de la inscripción
--      (inscripciones.categoria_id, igual que ya hace para el join de sesiones
--      — la del equipo solo como respaldo), como columna nueva al final.
--   2. v_ranking_equipo arma la categoría a partir de esa columna en vez de
--      pasar por equipos, y el join a equipos pasa a left join (el nombre del
--      equipo queda null para quien no tiene — el reporte ya lo cubre con
--      `equipo ?? "—"`).
-- ============================================================================

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
  , 1)                                                            as porcentaje,
  coalesce(i.categoria_id, eq.categoria_id)                       as categoria_id
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
group by i.jugador_id, i.temporada_id, i.equipo_id, coalesce(i.categoria_id, eq.categoria_id);

comment on view v_asistencia_jugador is
  'El porcentaje se calcula solo sobre las sesiones posteriores al alta del jugador: '
  'quien entra en octubre no queda castigado por las sesiones de marzo. Entrenamientos '
  'cuentan por la categoría de la inscripción (o la del equipo si no hay); partidos por equipo. '
  'categoria_id es esa misma categoría efectiva, para que v_ranking_equipo no dependa del equipo.';

-- `av.*` is deliberately NOT used here: v_asistencia_jugador just gained a
-- trailing `categoria_id` column, and expanding it positionally would insert
-- that column ahead of `codigo` below — shifting every column after it.
-- `CREATE OR REPLACE VIEW` rejects that as a column rename ("cannot change
-- name of view column ... to ..."). Listing av's columns explicitly keeps
-- every existing output column in its original name/position; only
-- `categoria_id`'s source changes (was `c.id` via the equipo join, now
-- `av.categoria_id` straight from the enrollment).
create or replace view v_ranking_equipo
with (security_invoker = on) as
select
  av.jugador_id,
  av.temporada_id,
  av.equipo_id,
  av.sesiones_convocadas,
  av.entrenamientos,
  av.partidos,
  av.presentes,
  av.tardes,
  av.justificados,
  av.ausentes,
  av.goles,
  av.minutos,
  av.porcentaje,
  j.codigo,
  j.nombres || ' ' || j.apellidos as nombre_completo,
  j.foto_url,
  e.nombre   as equipo,
  c.nombre   as categoria,
  case
    when av.porcentaje >= 85 then 'buena'
    when av.porcentaje >= 70 then 'regular'
    else 'baja'
  end as nivel_asistencia,
  rank() over (partition by av.equipo_id order by av.porcentaje desc nulls last) as puesto_equipo,
  rank() over (partition by c.id         order by av.porcentaje desc nulls last) as puesto_categoria,
  av.categoria_id as categoria_id,
  c.color    as categoria_color
from v_asistencia_jugador av
join jugadores  j on j.id = av.jugador_id
left join equipos    e on e.id = av.equipo_id
join categorias c on c.id = av.categoria_id;
