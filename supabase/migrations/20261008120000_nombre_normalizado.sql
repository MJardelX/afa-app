-- ============================================================================
--  AFA MANAGER — nombres sin tildes ni mayúsculas, para dos cosas:
--
--   1. No registrar dos veces al mismo jugador: "Jose Xiquita" y "José
--      xiquita" son la misma persona. Se cargaron varios duplicados así
--      (limpiados a mano el 2026-10-08) y la app no lo impedía.
--   2. Que los buscadores encuentren "José" escribiendo "jose" y viceversa.
--
--  `normalizar_texto` quita tildes (unaccent), pasa a minúsculas y colapsa
--  espacios. Se declara IMMUTABLE pasando el diccionario explícito — la
--  forma de un argumento de unaccent() es STABLE y no sirve para columnas
--  generadas ni índices.
--
--  La app normaliza igual del lado del cliente (src/lib/search.ts) para
--  comparar contra estas columnas.
-- ============================================================================

create extension if not exists unaccent with schema extensions;

create or replace function normalizar_texto(t text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(btrim(regexp_replace(
    extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, '')),
    '\s+', ' ', 'g'
  )));
$$;

comment on function normalizar_texto(text) is
  'Minúsculas, sin tildes y con espacios colapsados — para comparar y buscar nombres.';

-- ── jugadores ───────────────────────────────────────────────────────────────

alter table jugadores
  add column nombre_normalizado text
  generated always as (normalizar_texto(nombres || ' ' || apellidos)) stored;

create unique index jugador_nombre_unico
  on jugadores (academia_id, nombre_normalizado);

comment on column jugadores.nombre_normalizado is
  'nombres + apellidos sin tildes ni mayúsculas. Único por academia.';

-- ── tutores — solo para buscar (se deduplican por DPI, no por nombre) ───────

alter table tutores
  add column nombre_normalizado text
  generated always as (normalizar_texto(nombres || ' ' || apellidos)) stored;

-- ── v_jugadores — columna nueva al final (CREATE OR REPLACE VIEW no permite
--    insertarla en medio). Resto idéntico a 20260916230000_sexo_jugador.sql. ─

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

  j.sexo,

  j.nombre_normalizado

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
