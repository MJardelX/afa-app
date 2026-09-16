-- ============================================================================
-- AFA MANAGER — Evaluation access is role-based, not per-group ownership.
--
-- The previous migration moved evaluation from the player's team to their
-- training group, but still gated it on being the specific coach/assistant
-- assigned to that group (es_mi_jugador -> es_mi_categoria). In practice any
-- profile with the "entrenador" role can run training or take attendance
-- for any group, so evaluation shouldn't be more restrictive than that.
--
-- Evaluation access is now: director/coordinador (es_admin()), or any
-- entrenador — no per-group assignment check. A coach can still only write
-- under their own evaluador_id (can't fill in someone else's evaluation).
-- ============================================================================

drop policy if exists evaluacion_lectura on evaluaciones;
create policy evaluacion_lectura on evaluaciones
  for select using (
    exists (
      select 1 from jugadores j
       where j.id = jugador_id
         and j.academia_id = mi_academia()
         and (
           es_admin()
           or mi_rol() = 'entrenador'
           or (es_mi_hijo(j.id) and evaluaciones.estado = 'finalizada')
         )
    )
  );

drop policy if exists evaluacion_escritura on evaluaciones;
create policy evaluacion_escritura on evaluaciones
  for all using (
    (es_admin() or (mi_rol() = 'entrenador' and evaluador_id = auth.uid()))
    and exists (select 1 from jugadores j
                 where j.id = jugador_id and j.academia_id = mi_academia())
  ) with check (
    (es_admin() or (mi_rol() = 'entrenador' and evaluador_id = auth.uid()))
    and exists (select 1 from jugadores j
                 where j.id = jugador_id and j.academia_id = mi_academia())
  );
