-- ============================================================================
--  AFA MANAGER — DPI único por tutor
--
--  El alta de jugador captura al encargado inline. Para no duplicar a un padre
--  con varios hijos, la acción busca un tutor existente por DPI antes de crear
--  uno nuevo. Este índice hace que ese match sea exacto y confiable.
--
--  Parcial: el DPI es opcional (no todos lo dan de una); solo los tutores CON
--  DPI compiten por unicidad.
-- ============================================================================

create unique index if not exists tutor_dpi_unico
  on tutores (academia_id, dpi)
  where dpi is not null and dpi <> '';
