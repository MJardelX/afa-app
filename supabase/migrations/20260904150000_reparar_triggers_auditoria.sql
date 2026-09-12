-- ============================================================================
--  Repara los triggers de auditoría que faltaban.
--
--  Al armar el módulo de Reportes/Auditoría se detectó que solo
--  jugadores/tutores/equipos/temporadas/perfiles estaban dejando rastro en
--  `auditoria` — `fichas_medicas`, `inscripciones` y `evaluaciones` no
--  (probado insertando y borrando una inscripción real: cero filas nuevas en
--  `auditoria`). El bloque original que crea los 8 triggers no falla ruidoso
--  si alguno ya existe a medias, así que puede haberse aplicado parcialmente
--  sin avisar. Esta migración es idempotente: quita y vuelve a crear los 8.
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'jugadores','fichas_medicas','inscripciones','tutores',
    'equipos','temporadas','evaluaciones','perfiles'
  ] loop
    execute format('drop trigger if exists tg_auditoria_%s on %I', t, t);
    execute format(
      'create trigger tg_auditoria_%s after insert or update or delete on %I
         for each row execute function fn_auditoria()', t, t);
  end loop;
end $$;
