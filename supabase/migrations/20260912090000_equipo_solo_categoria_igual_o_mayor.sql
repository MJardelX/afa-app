-- ============================================================================
--  AFA MANAGER — Un jugador solo puede SUBIR de categoría de equipo, nunca
--  bajar.
--
--  La categoría por edad es un atributo inherente del jugador: se calcula
--  siempre de su fecha de nacimiento (edad_deportiva), nunca se guarda ni se
--  asigna a mano. Lo que SÍ es asignable es:
--    · El grupo de entrenamiento (inscripciones.categoria_id) — ya es libre
--      en cualquier dirección desde categoria_independiente_del_equipo: un
--      jugador puede entrenar en un grupo menor o mayor al suyo por técnica.
--    · El equipo (inscripciones.equipo_id → equipos.categoria_id) — aquí la
--      regla es de una sola vía: puede jugar en un equipo de su categoría o
--      de una MAYOR (sube), nunca en una MENOR (no baja).
-- ============================================================================

create or replace function fn_validar_equipo_categoria()
returns trigger language plpgsql as $$
declare
  v_edad_min_real   int;
  v_edad_min_equipo int;
begin
  if new.equipo_id is null then
    return new;
  end if;

  select ce.edad_min into v_edad_min_real
    from jugadores j
    join temporadas t on t.id = new.temporada_id
    join categorias ce
      on ce.academia_id = j.academia_id
     and ce.activa
     and edad_deportiva(j.fecha_nacimiento, t.anio) between ce.edad_min and ce.edad_max
   where j.id = new.jugador_id;

  -- Sin categoría real (edad fuera de todos los rangos activos): no hay
  -- nada contra qué comparar, no se restringe.
  if v_edad_min_real is null then
    return new;
  end if;

  select c.edad_min into v_edad_min_equipo
    from equipos e
    join categorias c on c.id = e.categoria_id
   where e.id = new.equipo_id;

  if v_edad_min_equipo is not null and v_edad_min_equipo < v_edad_min_real then
    raise exception
      'Categoría de equipo menor a la real: solo puede subir de categoría, nunca bajar.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger tg_inscripcion_equipo_categoria
  before insert or update of equipo_id on inscripciones
  for each row execute function fn_validar_equipo_categoria();

-- ============================================================================
--  v_jugadores — bandera para avisar en la UI (antes de chocar con el
--  trigger) cuándo el equipo elegido quedaría por debajo de la categoría real
--  del jugador. Columna nueva al final: CREATE OR REPLACE VIEW no permite
--  insertarla en medio de la lista.
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

  ce.edad_min as categoria_por_edad_edad_min

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
