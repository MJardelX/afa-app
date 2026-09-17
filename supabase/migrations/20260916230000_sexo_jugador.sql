-- ============================================================================
--  AFA MANAGER — el sexo del jugador (masculino/femenino) pasa a ser un dato
--  requerido, para poder llevar métricas de participación por niños y niñas.
--
--  Solo dos valores: la academia no necesita más granularidad para sus
--  reportes. Los jugadores que ya existían se completan a mano en este mismo
--  script (son pocos) antes de exigir NOT NULL, para no romper la carga en
--  la base ya poblada.
-- ============================================================================

alter table jugadores add column sexo text;

update jugadores set sexo = 'femenino' where id = '06774e7a-8c81-4e84-ac8f-3dba600407d8';
update jugadores set sexo = 'masculino' where sexo is null;

alter table jugadores
  add constraint jugadores_sexo_check check (sexo in ('masculino', 'femenino')),
  alter column sexo set not null;

comment on column jugadores.sexo is
  'Solo masculino/femenino — la academia no pide más granularidad.';

-- ── v_jugadores — columna nueva al final: CREATE OR REPLACE VIEW no permite
--    insertarla en medio de la lista. ────────────────────────────────────────

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

  ec.nombre as equipo_categoria,
  (e.id is not null
   and e.categoria_id is distinct from coalesce(i.categoria_id, e.categoria_id))
    as equipo_categoria_distinta,

  (e.id is not null and ce.id is not null and ec.edad_min < ce.edad_min)
    as equipo_por_debajo_de_edad,

  ce.edad_min as categoria_por_edad_edad_min,

  j.sexo

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
