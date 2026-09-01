-- ============================================================================
--  AFA MANAGER — Funciones, triggers y vistas
-- ============================================================================

-- ============================================================================
--  EDAD
-- ============================================================================

-- Edad DEPORTIVA: los años que el jugador cumple DURANTE el año de temporada.
-- Es la que define la categoría (convención del fútbol formativo: por año de
-- nacimiento, no por cumpleaños).
create or replace function edad_deportiva(fecha_nac date, anio_temporada int)
returns int
language sql immutable parallel safe
as $$
  select anio_temporada - extract(year from fecha_nac)::int;
$$;

-- Edad REAL: la del cumpleaños. Para la ficha, el carné y los cumpleaños.
create or replace function edad_real(fecha_nac date)
returns int
language sql stable parallel safe
as $$
  select extract(year from age(current_date, fecha_nac))::int;
$$;

-- ============================================================================
--  CÓDIGO DE JUGADOR — AFA-2026-0001
-- ============================================================================

create or replace function siguiente_codigo_jugador(p_academia uuid)
returns text
language plpgsql
as $$
declare
  v_anio    int := extract(year from current_date)::int;
  v_prefijo text;
  v_num     int;
begin
  select prefijo_codigo into v_prefijo from academias where id = p_academia;

  insert into correlativos (academia_id, anio, ultimo)
  values (p_academia, v_anio, 1)
  on conflict (academia_id, anio)
    do update set ultimo = correlativos.ultimo + 1
  returning ultimo into v_num;

  return coalesce(v_prefijo, 'AFA') || '-' || v_anio || '-' || lpad(v_num::text, 4, '0');
end;
$$;

create or replace function fn_asignar_codigo_jugador()
returns trigger language plpgsql as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := siguiente_codigo_jugador(new.academia_id);
  end if;
  return new;
end;
$$;

create trigger tg_jugador_codigo
  before insert on jugadores
  for each row execute function fn_asignar_codigo_jugador();

-- ============================================================================
--  actualizado_en AUTOMÁTICO
-- ============================================================================

create or replace function fn_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'academias','perfiles','jugadores','tutores','inscripciones',
    'sesiones','evaluaciones'
  ] loop
    execute format(
      'create trigger tg_%s_actualizado before update on %I
         for each row execute function fn_actualizado_en()', t, t);
  end loop;
end $$;

-- ============================================================================
--  GUARDA: la sesión debe pertenecer a la temporada de su equipo
-- ============================================================================

create or replace function fn_validar_sesion()
returns trigger language plpgsql as $$
declare
  v_temporada uuid;
  v_academia  uuid;
begin
  select temporada_id, academia_id into v_temporada, v_academia
    from equipos where id = new.equipo_id;

  new.temporada_id := v_temporada;
  new.academia_id  := v_academia;
  return new;
end;
$$;

create trigger tg_sesion_coherente
  before insert or update of equipo_id on sesiones
  for each row execute function fn_validar_sesion();

-- ============================================================================
--  FECHA DE ALTA DE LA INSCRIPCIÓN
--  Si no se especifica, el jugador participa desde que arranca la temporada,
--  o desde que ingresó a la academia si entró después. Nunca "desde hoy":
--  eso dejaría inaccesible la asistencia del ciclo ya transcurrido.
-- ============================================================================

create or replace function fn_inscripcion_fecha_alta()
returns trigger language plpgsql as $$
declare
  v_inicio_temporada date;
  v_ingreso_academia date;
begin
  if new.fecha_alta is null then
    select fecha_inicio  into v_inicio_temporada from temporadas where id = new.temporada_id;
    select fecha_ingreso into v_ingreso_academia from jugadores  where id = new.jugador_id;
    new.fecha_alta := greatest(v_inicio_temporada, v_ingreso_academia);
  end if;
  return new;
end;
$$;

create trigger tg_inscripcion_fecha_alta
  before insert on inscripciones
  for each row execute function fn_inscripcion_fecha_alta();

-- ============================================================================
--  GUARDA: solo se pasa asistencia a jugadores inscritos en ese equipo
-- ============================================================================

create or replace function fn_validar_asistencia()
returns trigger language plpgsql as $$
declare
  v_ok boolean;
begin
  select exists (
    select 1
      from sesiones s
      join inscripciones i
        on i.equipo_id = s.equipo_id
       and i.jugador_id = new.jugador_id
       and i.estado = 'activa'
       and s.fecha >= i.fecha_alta
       and (i.fecha_baja is null or s.fecha <= i.fecha_baja)
     where s.id = new.sesion_id
  ) into v_ok;

  if not v_ok then
    raise exception
      'El jugador no está inscrito en el equipo de esta sesión en esa fecha';
  end if;

  return new;
end;
$$;

create trigger tg_asistencia_valida
  before insert or update on asistencias
  for each row execute function fn_validar_asistencia();

-- ============================================================================
--  VISTA PRINCIPAL — v_jugadores
--  Devuelve la categoría como si fuera una columna guardada, pero calculada.
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

  -- Categoría en la que REALMENTE juega (NULL si aún no tiene equipo)
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
  (i.id is null)                                       as sin_inscribir

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
left join categorias cj on cj.id = e.categoria_id;

comment on view v_jugadores is
  'Jugadores de la temporada activa con su categoría calculada. Consultar como tabla.';

-- ============================================================================
--  ASISTENCIA — porcentaje, semáforo y ranking (calculados, nunca guardados)
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
  , 1)                                                            as porcentaje
from inscripciones i
join sesiones s
  on s.equipo_id = i.equipo_id
 and s.estado = 'realizada'
 and s.fecha >= i.fecha_alta
 and (i.fecha_baja is null or s.fecha <= i.fecha_baja)
left join asistencias a
  on a.sesion_id = s.id and a.jugador_id = i.jugador_id
where i.estado = 'activa'
group by i.jugador_id, i.temporada_id, i.equipo_id;

comment on view v_asistencia_jugador is
  'El porcentaje se calcula solo sobre las sesiones posteriores al alta del jugador: '
  'quien entra en octubre no queda castigado por las sesiones de marzo.';

create or replace view v_ranking_equipo
with (security_invoker = on) as
select
  av.*,
  j.codigo,
  j.nombres || ' ' || j.apellidos as nombre_completo,
  j.foto_url,
  e.nombre   as equipo,
  c.nombre   as categoria,
  -- Nivel, no color. La interfaz no usa verde/amarillo/rojo puros porque son
  -- indistinguibles en protanopia; nombrarlo por color aquí obligaría a
  -- traducirlo en cada pantalla y tarde o temprano alguien pintaría un verde.
  case
    when av.porcentaje >= 85 then 'buena'
    when av.porcentaje >= 70 then 'regular'
    else 'baja'
  end as nivel_asistencia,
  rank() over (partition by av.equipo_id order by av.porcentaje desc nulls last) as puesto_equipo,
  rank() over (partition by c.id         order by av.porcentaje desc nulls last) as puesto_categoria
from v_asistencia_jugador av
join jugadores  j on j.id = av.jugador_id
join equipos    e on e.id = av.equipo_id
join categorias c on c.id = e.categoria_id;

-- ============================================================================
--  EVALUACIÓN — promedio ponderado por dimensión
-- ============================================================================

create or replace view v_evaluacion_dimension
with (security_invoker = on) as
select
  ev.jugador_id,
  ev.periodo_id,
  p.temporada_id,
  p.nombre  as periodo,
  cr.dimension,
  round(sum(d.puntaje * cr.peso) / nullif(sum(cr.peso), 0), 2) as promedio,
  count(*) as criterios_evaluados
from evaluaciones ev
join evaluacion_detalle   d  on d.evaluacion_id = ev.id
join criterios_evaluacion cr on cr.id = d.criterio_id
join periodos_evaluacion  p  on p.id = ev.periodo_id
where ev.estado = 'finalizada'
group by ev.jugador_id, ev.periodo_id, p.temporada_id, p.nombre, cr.dimension;

-- ============================================================================
--  RENOVACIÓN DE TEMPORADA
--  Lo que hace posible cerrar el año en una pantalla en vez de a mano.
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
  left join categorias c  on c.id  = e.categoria_id
  left join categorias ce on ce.academia_id = j.academia_id and ce.activa
    and edad_deportiva(j.fecha_nacimiento, d.anio - 1) between ce.edad_min and ce.edad_max
  left join categorias cn on cn.academia_id = j.academia_id and cn.activa
    and edad_deportiva(j.fecha_nacimiento, d.anio) between cn.edad_min and cn.edad_max
  order by cn.orden nulls last, j.apellidos, j.nombres;
$$;

comment on function preview_renovacion is
  'Simula el cambio de ciclo sin escribir nada. Cada jugador sube de categoría solo, '
  'porque la categoría se deriva de la fecha de nacimiento y del año de la temporada.';
