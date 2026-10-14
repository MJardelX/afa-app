-- ============================================================================
--  AFA MANAGER — fn_sesion_cierre_staff ignoraba 'updated_at', pero la
--  columna se llama 'actualizado_en'. Hoy funcionaba solo porque
--  tg_sesion_cierre_staff corre antes que tg_sesiones_actualizado (orden
--  alfabético); si el orden cambiara, cerrar una sesión ajena fallaría.
-- ============================================================================

create or replace function fn_sesion_cierre_staff()
returns trigger language plpgsql as $$
begin
  -- Quien gestiona la sesión puede cambiar lo que quiera.
  if es_admin()
     or (new.equipo_id is not null and es_mi_equipo(new.equipo_id))
     or (new.categoria_id is not null and es_mi_categoria(new.categoria_id))
     or auth.uid() is null  -- service role / migraciones
  then
    return new;
  end if;

  -- El resto del staff solo puede cambiar el estado.
  if (to_jsonb(new) - 'estado' - 'actualizado_en')
     is distinct from (to_jsonb(old) - 'estado' - 'actualizado_en') then
    raise exception 'Solo puedes cerrar o reabrir esta sesión'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
