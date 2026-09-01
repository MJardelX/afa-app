-- ============================================================================
--  AFA MANAGER — Datos iniciales
--  Se aplica con `supabase db reset` (local) o pegando en el SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
--  Academia
-- ----------------------------------------------------------------------------
insert into academias (id, nombre, nombre_corto, prefijo_codigo, color_primario, color_secundario)
values (
  '11111111-1111-4111-8111-111111111111',
  'Academia de Fútbol Amistad',
  'AFA',
  'AFA',
  '#0b6896',
  '#facc15'
)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
--  Temporada activa
-- ----------------------------------------------------------------------------
insert into temporadas (id, academia_id, nombre, anio, fecha_inicio, fecha_fin, activa)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Ciclo 2026', 2026, '2026-01-15', '2026-11-30', true
)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
--  NIVEL 1 — Categorías
--  edad_min/edad_max son EDAD DEPORTIVA: (año de temporada - año de nacimiento).
--  En el Ciclo 2026, Sub-10 = nacidos en 2016 y 2017.
--  Ajustables desde la app; la restricción impide que dos se traslapen.
-- ----------------------------------------------------------------------------
insert into categorias (academia_id, nombre, edad_min, edad_max, orden) values
  ('11111111-1111-4111-8111-111111111111', 'Sub-6',   5,  6, 1),
  ('11111111-1111-4111-8111-111111111111', 'Sub-8',   7,  8, 2),
  ('11111111-1111-4111-8111-111111111111', 'Sub-10',  9, 10, 3),
  ('11111111-1111-4111-8111-111111111111', 'Sub-12', 11, 12, 4),
  ('11111111-1111-4111-8111-111111111111', 'Sub-14', 13, 14, 5),
  ('11111111-1111-4111-8111-111111111111', 'Sub-16', 15, 16, 6),
  ('11111111-1111-4111-8111-111111111111', 'Sub-18', 17, 18, 7)
on conflict (academia_id, nombre) do nothing;

-- ----------------------------------------------------------------------------
--  NIVEL 2 — Equipos del Ciclo 2026
--  El entrenador se asigna después, cuando existan los usuarios.
-- ----------------------------------------------------------------------------
insert into equipos (academia_id, temporada_id, categoria_id, nombre, dias_entreno, hora_entreno)
select
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  c.id,
  c.nombre || ' A',
  array['martes', 'jueves'],
  time '16:00'
from categorias c
where c.academia_id = '11111111-1111-4111-8111-111111111111'
on conflict (temporada_id, nombre) do nothing;

-- ----------------------------------------------------------------------------
--  Períodos de evaluación
--  Sin período no hay línea de progreso, que es justo lo que el padre quiere ver.
-- ----------------------------------------------------------------------------
insert into periodos_evaluacion (temporada_id, nombre, fecha_inicio, fecha_fin, orden) values
  ('22222222-2222-4222-8222-222222222222', 'Período 1', '2026-01-15', '2026-03-31', 1),
  ('22222222-2222-4222-8222-222222222222', 'Período 2', '2026-04-01', '2026-06-30', 2),
  ('22222222-2222-4222-8222-222222222222', 'Período 3', '2026-07-01', '2026-09-30', 3),
  ('22222222-2222-4222-8222-222222222222', 'Período 4', '2026-10-01', '2026-11-30', 4)
on conflict (temporada_id, nombre) do nothing;

-- ----------------------------------------------------------------------------
--  Criterios de evaluación — escala 1 a 5 CON RÚBRICA
--
--  Los 10 ítems de la propuesta original, reorganizados en 4 dimensiones y con
--  anclas de texto. Sin anclas, un entrenador cansado pone 8 en todo y la
--  gráfica queda plana y sin valor.
--
--  "Compromiso" no aparece aquí a propósito: se mide con la asistencia real,
--  que es un dato objetivo, no con una opinión.
-- ----------------------------------------------------------------------------
insert into criterios_evaluacion (academia_id, dimension, nombre, descripcion, peso, orden, rubrica) values

-- TÉCNICA
('11111111-1111-4111-8111-111111111111', 'tecnica', 'Control y pase',
 'Recepción, orientación del control y precisión del pase corto y medio.', 1.0, 1,
 '{"1":"Pierde el control con frecuencia; el pase no llega al compañero.",
   "3":"Controla y pasa bien sin presión; falla cuando lo presionan.",
   "5":"Controla orientado y pasa con precisión bajo presión, con ambas piernas."}'::jsonb),

('11111111-1111-4111-8111-111111111111', 'tecnica', 'Conducción y regate',
 'Manejo del balón en movimiento y capacidad de superar al rival.', 1.0, 2,
 '{"1":"Conduce mirando el balón; pierde la posesión al primer contacto.",
   "3":"Conduce con la cabeza arriba; intenta el regate con éxito parcial.",
   "5":"Conduce a velocidad sin perder el control y supera al rival con criterio."}'::jsonb),

('11111111-1111-4111-8111-111111111111', 'tecnica', 'Definición',
 'Remate y finalización.', 1.0, 3,
 '{"1":"Remata sin dirección ni potencia.",
   "3":"Define bien en situaciones cómodas.",
   "5":"Define con precisión bajo presión y elige bien el recurso."}'::jsonb),

-- TÁCTICA
('11111111-1111-4111-8111-111111111111', 'tactica', 'Toma de decisiones',
 'Elegir la mejor opción según el momento del juego.', 1.5, 4,
 '{"1":"Juega solo para sí mismo; no lee la jugada.",
   "3":"Toma decisiones correctas la mayor parte del tiempo.",
   "5":"Anticipa, elige rápido y casi siempre acierta."}'::jsonb),

('11111111-1111-4111-8111-111111111111', 'tactica', 'Posicionamiento',
 'Ocupación de espacios en ataque y defensa.', 1.0, 5,
 '{"1":"Persigue el balón sin respetar su posición.",
   "3":"Mantiene su posición; se descoloca en transiciones.",
   "5":"Ocupa bien el espacio y ajusta su posición según el juego."}'::jsonb),

-- FÍSICA
('11111111-1111-4111-8111-111111111111', 'fisica', 'Resistencia',
 'Sostiene el rendimiento durante toda la sesión o el partido.', 1.0, 6,
 '{"1":"Se agota en los primeros minutos.",
   "3":"Aguanta la mayor parte; baja al final.",
   "5":"Mantiene el nivel de principio a fin."}'::jsonb),

('11111111-1111-4111-8111-111111111111', 'fisica', 'Velocidad y agilidad',
 'Aceleración, cambios de dirección y coordinación.', 1.0, 7,
 '{"1":"Lento para arrancar y girar.",
   "3":"Buena velocidad en línea recta.",
   "5":"Rápido, ágil y coordinado en cualquier dirección."}'::jsonb),

('11111111-1111-4111-8111-111111111111', 'fisica', 'Intensidad',
 'Ritmo y entrega en cada acción del entrenamiento.', 1.0, 8,
 '{"1":"Trota; evita el contacto y la disputa.",
   "3":"Se entrega en los ejercicios que le gustan.",
   "5":"Entrena a intensidad de partido, siempre."}'::jsonb),

-- ACTITUDINAL
('11111111-1111-4111-8111-111111111111', 'actitudinal', 'Disciplina y puntualidad',
 'Cumple horarios, normas y uniforme.', 1.5, 9,
 '{"1":"Llega tarde con frecuencia e incumple las normas.",
   "3":"Cumple casi siempre; requiere recordatorios.",
   "5":"Puntual y ordenado sin que nadie se lo pida."}'::jsonb),

('11111111-1111-4111-8111-111111111111', 'actitudinal', 'Respeto y actitud',
 'Trato al entrenador, compañeros, rivales y árbitro.', 2.0, 10,
 '{"1":"Reclama, protesta o falta al respeto.",
   "3":"Respetuoso; se frustra cuando pierde.",
   "5":"Respetuoso y positivo incluso en la derrota."}'::jsonb),

('11111111-1111-4111-8111-111111111111', 'actitudinal', 'Trabajo en equipo',
 'Coopera, comparte el balón y apoya al compañero.', 1.5, 11,
 '{"1":"Juega individual; culpa a los demás.",
   "3":"Colabora cuando se le pide.",
   "5":"Hace mejores a sus compañeros y celebra sus logros."}'::jsonb),

('11111111-1111-4111-8111-111111111111', 'actitudinal', 'Liderazgo',
 'Influencia positiva dentro del grupo.', 1.0, 12,
 '{"1":"Se aísla o influye negativamente.",
   "3":"Da el ejemplo con su conducta.",
   "5":"Organiza, anima y levanta al equipo en los momentos difíciles."}'::jsonb)

on conflict (academia_id, nombre) do nothing;
