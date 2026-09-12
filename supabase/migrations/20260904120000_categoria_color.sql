-- ============================================================================
--  Color por categoría — para diferenciarlas en el calendario de asistencia.
-- ============================================================================

alter table categorias add column if not exists color text;

comment on column categorias.color is
  'Hex (#rrggbb). Usado como acento en el calendario de sesiones y en chips
   de categoría; nunca es el único diferenciador (siempre va con texto).';

-- Paleta inicial para las categorías del seed, por orden. Los admins pueden
-- cambiarla libremente desde Configuración → Categorías.
update categorias set color = case orden % 7
  when 1 then '#ef4444' -- red
  when 2 then '#f97316' -- orange
  when 3 then '#eab308' -- yellow
  when 4 then '#22c55e' -- green
  when 5 then '#06b6d4' -- cyan
  when 6 then '#6366f1' -- indigo
  else        '#ec4899' -- pink
end
where color is null;

alter table categorias alter column color set default '#0ea5e9';
alter table categorias alter column color set not null;
