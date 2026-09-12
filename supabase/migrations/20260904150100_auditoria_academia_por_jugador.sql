-- ============================================================================
--  Bug real encontrado al construir Auditoría: `fn_auditoria()` solo sabía
--  leer `academia_id` como columna directa de la fila. `inscripciones`,
--  `fichas_medicas` y `evaluaciones` NO tienen esa columna (cuelgan de
--  jugador_id), así que sus filas de auditoría se insertaban con
--  academia_id = NULL. La política de lectura exige
--  `academia_id = mi_academia()` — con NULL esa comparación nunca es
--  verdadera, así que esas filas quedaban escritas pero invisibles para
--  siempre, incluso para el director. Probado insertando/borrando una
--  inscripción real: la fila de auditoría no aparecía en ninguna consulta.
--
--  Arreglo: si la fila no trae academia_id propio, se deriva del jugador
--  relacionado (todas las tablas afectadas tienen jugador_id). También se
--  arregla `registro_id`, que para `fichas_medicas` siempre salía NULL
--  porque esa tabla no tiene columna `id` — su PK es jugador_id.
-- ============================================================================

create or replace function fn_auditoria()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_academia   uuid;
  v_registro   uuid;
  v_row        jsonb;
begin
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;

  begin
    v_academia := (v_row ->> 'academia_id')::uuid;
  exception when others then
    v_academia := null;
  end;

  -- Sin academia_id propio (inscripciones, fichas_medicas, evaluaciones):
  -- se busca por el jugador relacionado.
  if v_academia is null and v_row ? 'jugador_id' and v_row ->> 'jugador_id' is not null then
    begin
      select j.academia_id into v_academia
        from jugadores j
       where j.id = (v_row ->> 'jugador_id')::uuid;
    exception when others then
      v_academia := null;
    end;
  end if;

  -- registro_id: normalmente `id`; si la tabla no tiene esa columna
  -- (fichas_medicas, cuya PK es jugador_id) se usa jugador_id.
  begin
    v_registro := coalesce((v_row ->> 'id')::uuid, (v_row ->> 'jugador_id')::uuid);
  exception when others then
    v_registro := null;
  end;

  if tg_op = 'DELETE' then
    insert into auditoria (academia_id, tabla, registro_id, accion, usuario_id, datos_previos)
    values (v_academia, tg_table_name, v_registro, tg_op, auth.uid(), to_jsonb(old));
    return old;
  else
    insert into auditoria (academia_id, tabla, registro_id, accion, usuario_id, datos_previos, datos_nuevos)
    values (
      v_academia, tg_table_name, v_registro, tg_op, auth.uid(),
      case when tg_op = 'UPDATE' then to_jsonb(old) end,
      to_jsonb(new)
    );
    return new;
  end if;
end;
$$;
