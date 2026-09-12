-- ============================================================================
--  AFA MANAGER — Apto médico deportivo en la ficha médica
--
--  Estándar en fútbol formativo: la academia exige un "apto para práctica
--  deportiva" firmado por un médico, normalmente con vigencia anual.
-- ============================================================================

alter table fichas_medicas
  add column if not exists apto_deportivo boolean,
  add column if not exists fecha_apto     date;

comment on column fichas_medicas.apto_deportivo is
  'Apto médico para práctica deportiva. NULL = sin evaluar todavía.';
