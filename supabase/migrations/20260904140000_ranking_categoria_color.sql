-- ============================================================================
--  v_ranking_equipo: agrega categoria_id y el color de la categoría, para que
--  el reporte de asistencia pueda agrupar/pintar sin una segunda consulta.
--  (No tiene relación con el comentario de "nivel, no color" de más abajo —
--  ese es sobre no codificar el % de asistencia por color; el color de
--  categoría es el mismo acento que ya se usa en Equipos/Asistencia/Evaluación.)
-- ============================================================================

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
  rank() over (partition by c.id         order by av.porcentaje desc nulls last) as puesto_categoria,
  -- Añadidas al final: CREATE OR REPLACE VIEW solo permite agregar columnas,
  -- no insertarlas entre las existentes.
  c.id       as categoria_id,
  c.color    as categoria_color
from v_asistencia_jugador av
join jugadores  j on j.id = av.jugador_id
join equipos    e on e.id = av.equipo_id
join categorias c on c.id = e.categoria_id;
