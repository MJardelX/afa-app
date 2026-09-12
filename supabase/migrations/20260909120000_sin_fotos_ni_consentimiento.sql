-- ============================================================================
--  AFA MANAGER — La academia decidió NO usar fotos de los menores.
--
--  Sin fotos, toda la maquinaria de consentimiento granular por finalidad
--  sobra (P1–P4 eran de imagen). Se elimina la tabla `consentimientos`, la
--  bitácora de accesos a fotos y sus tipos. Las columnas vestigiales de
--  `jugadores` (foto_url, autoriza_uso_imagen, fecha_autorizacion) y el bucket
--  `fotos` se dejan como están: quedan sin uso, sin datos y sin riesgo.
-- ============================================================================

drop view if exists v_consentimiento_vigente;
drop table if exists consentimientos;
drop table if exists accesos_media;

drop type if exists finalidad_consentimiento;
drop type if exists metodo_consentimiento;
