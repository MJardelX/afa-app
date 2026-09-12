-- ============================================================================
--  AFA MANAGER — Categoría en la inscripción
--
--  Hasta ahora la categoría "real" del jugador salía SOLO del equipo. Eso deja
--  sin registrar dos casos legítimos:
--    1. El asistente de alta inscribe al jugador en el ciclo aunque todavía no
--       tenga equipo asignado.
--    2. La renovación de temporada crea inscripciones sin equipo.
--  Con `inscripciones.categoria_id` la categoría (y su excepción por edad) queda
--  registrada aunque no haya equipo. Si hay equipo, manda el equipo.
-- ============================================================================

alter table inscripciones
  add column categoria_id uuid references categorias(id) on delete restrict;

comment on column inscripciones.categoria_id is
  'Categoría del jugador esta temporada. Con equipo: la deriva del equipo (trigger). Sin equipo: se fija a mano (alta / renovación).';

-- Backfill: toda inscripción con equipo hereda la categoría del equipo.
update inscripciones i
   set categoria_id = e.categoria_id
  from equipos e
 where e.id = i.equipo_id
   and i.categoria_id is null;

-- Mantiene categoria_id coherente: si la inscripción tiene equipo, la categoría
-- SIEMPRE es la del equipo (el usuario no la puede desincronizar).
create or replace function fn_inscripcion_categoria()
returns trigger language plpgsql as $$
begin
  if new.equipo_id is not null then
    select categoria_id into new.categoria_id
      from equipos where id = new.equipo_id;
  end if;
  return new;
end;
$$;

create trigger tg_inscripcion_categoria
  before insert or update of equipo_id, categoria_id on inscripciones
  for each row execute function fn_inscripcion_categoria();

-- ============================================================================
--  v_jugadores — la categoría real ahora sale de la inscripción o del equipo,
--  y se agrega `sin_equipo` (inscrito en el ciclo pero todavía sin equipo).
--  La columna nueva va AL FINAL: CREATE OR REPLACE VIEW no permite insertarla
--  en medio de la lista.
-- ============================================================================

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

  -- Las dos edades, que no son la misma cosa
  edad_real(j.fecha_nacimiento)                     as edad_real,
  edad_deportiva(j.fecha_nacimiento, t.anio)        as edad_deportiva,

  -- Categoría que le CORRESPONDE por edad (siempre existe, se recalcula sola)
  ce.id     as categoria_por_edad_id,
  ce.nombre as categoria_por_edad,

  -- Categoría en la que REALMENTE juega: la de la inscripción, o la del equipo
  cj.id     as categoria_id,
  cj.nombre as categoria,
  e.id      as equipo_id,
  e.nombre  as equipo,
  e.entrenador_id,
  i.id      as inscripcion_id,
  i.numero_camiseta,
  i.posicion,
  i.motivo_excepcion,

  -- Bandera automática de excepción
  (cj.id is not null and cj.id is distinct from ce.id) as fuera_de_categoria,
  (i.id is null)                                       as sin_inscribir,
  -- Inscrito en el ciclo pero sin equipo asignado todavía
  (i.id is not null and i.equipo_id is null)           as sin_equipo

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
left join categorias cj on cj.id = coalesce(i.categoria_id, e.categoria_id);

comment on view v_jugadores is
  'Jugadores de la temporada activa con su categoría calculada. Consultar como tabla.';

-- ============================================================================
--  preview_renovacion — la categoría anterior también sale de la inscripción
--  cuando el jugador no tenía equipo.
-- ============================================================================

create or replace function preview_renovacion(p_temporada_destino uuid)
returns table (
  jugador_id           uuid,
  codigo               text,
  nombre_completo      text,
  equipo_anterior      text,
  categoria_anterior   text,
  categoria_sugerida   text,
  categoria_sugerida_id uuid,
  edad_deportiva_nueva int,
  egresa               boolean,
  estaba_fuera_categoria boolean
)
language sql stable as $$
  with destino as (
    select id, academia_id, anio from temporadas where id = p_temporada_destino
  ),
  origen as (
    select t.id
      from temporadas t, destino d
     where t.academia_id = d.academia_id and t.anio = d.anio - 1
  )
  select
    j.id,
    j.codigo,
    j.nombres || ' ' || j.apellidos,
    e.nombre,
    c.nombre,
    cn.nombre,
    cn.id,
    edad_deportiva(j.fecha_nacimiento, d.anio),
    cn.id is null,
    c.id is distinct from ce.id
  from destino d
  join origen o on true
  join inscripciones i on i.temporada_id = o.id and i.es_principal and i.estado = 'activa'
  join jugadores j on j.id = i.jugador_id and j.estado = 'activo'
  left join equipos    e  on e.id  = i.equipo_id
  left join categorias c  on c.id  = coalesce(i.categoria_id, e.categoria_id)
  left join categorias ce on ce.academia_id = j.academia_id and ce.activa
    and edad_deportiva(j.fecha_nacimiento, d.anio - 1) between ce.edad_min and ce.edad_max
  left join categorias cn on cn.academia_id = j.academia_id and cn.activa
    and edad_deportiva(j.fecha_nacimiento, d.anio) between cn.edad_min and cn.edad_max
  order by cn.orden nulls last, j.apellidos, j.nombres;
$$;
