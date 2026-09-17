-- ============================================================================
--  AFA MANAGER — Las evaluaciones son por GRUPO DE ENTRENAMIENTO, no por
--  equipo.
--
--  Hasta ahora, evaluar a un jugador dependía de si eras entrenador/auxiliar
--  de su EQUIPO (es_mi_jugador → equipos.entrenador_id/auxiliar_id). Eso deja
--  fuera a cualquier jugador inscrito en un grupo de entrenamiento pero que
--  todavía no tiene equipo asignado — hoy no aparece en ninguna lista de
--  evaluación de nadie.
--
--  El grupo de entrenamiento (categorias) ya tiene su propio horario y lugar
--  (dias_entreno/hora_entreno/lugar_entreno) — le faltaba su propio
--  entrenador/auxiliar, igual que ya tienen los equipos. Con eso:
--    · Un entrenador puede evaluar un grupo si es su entrenador/auxiliar
--      DIRECTO, o si lo es de CUALQUIER equipo dentro de esa categoría
--      (mismo criterio que ya usa es_mi_categoria para entrenamientos).
--    · La lista de jugadores a evaluar de un grupo sale de
--      inscripciones.categoria_id, no de equipo_id — así entran también los
--      jugadores sin equipo todavía.
-- ============================================================================

alter table categorias
  add column entrenador_id uuid references perfiles(id) on delete set null,
  add column auxiliar_id   uuid references perfiles(id) on delete set null;

comment on column categorias.entrenador_id is
  'Entrenador a cargo del grupo de entrenamiento (independiente del entrenador de cada equipo).';
comment on column categorias.auxiliar_id is
  'Auxiliar del grupo de entrenamiento.';

-- ── es_mi_categoria: ahora también reconoce al entrenador/auxiliar DIRECTO
--    del grupo, además del heredado de cualquiera de sus equipos. ──────────

create or replace function es_mi_categoria(p_categoria uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from categorias c
     where c.id = p_categoria
       and (c.entrenador_id = auth.uid() or c.auxiliar_id = auth.uid())
  )
  or exists (
    select 1 from equipos e
    join temporadas t on t.id = e.temporada_id and t.activa
     where e.categoria_id = p_categoria
       and (e.entrenador_id = auth.uid() or e.auxiliar_id = auth.uid())
  );
$$;

-- ── es_mi_jugador: pasa de mirar el EQUIPO del jugador a mirar su GRUPO DE
--    ENTRENAMIENTO (inscripciones.categoria_id) — la única cosa que usa esta
--    función son las políticas de evaluaciones, así que el cambio de
--    significado es seguro. ───────────────────────────────────────────────

create or replace function es_mi_jugador(p_jugador uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from inscripciones i
      join temporadas t on t.id = i.temporada_id and t.activa
     where i.jugador_id = p_jugador
       and i.estado = 'activa'
       and i.categoria_id is not null
       and es_mi_categoria(i.categoria_id)
  );
$$;
