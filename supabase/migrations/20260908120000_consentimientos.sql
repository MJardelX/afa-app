-- ============================================================================
--  AFA MANAGER — Consentimiento por finalidad + bitácora de accesos a fotos
--
--  Reemplaza el `jugadores.autoriza_uso_imagen` (un booleano opaco) por un
--  registro granular: un permiso por finalidad, quién lo firmó, cuándo, con qué
--  evidencia y cómo se revocó. Tratado como BITÁCORA INMUTABLE — para cambiar
--  un permiso se inserta una fila nueva; nunca se edita ni se borra.
--  Datos de menores: esto es lo que sostiene la base legal del tratamiento.
-- ============================================================================

create type finalidad_consentimiento as enum (
  'p1_ficha',   -- foto en el expediente interno, solo personal de la academia
  'p2_admin',   -- carné impreso, listas de convocatoria, programas a familias
  'p3_redes',   -- redes sociales y sitio web (difusión pública)
  'p4_prensa',  -- prensa y material promocional
  'p5_cesion',  -- cesión a federación / torneos / aseguradora
  'p6_medico'   -- tratamiento de datos médicos (dato sensible)
);

create type metodo_consentimiento as enum (
  'formulario_fisico', 'formulario_digital', 'en_app'
);

create table consentimientos (
  id               uuid primary key default gen_random_uuid(),
  jugador_id       uuid not null references jugadores(id) on delete cascade,
  tutor_id         uuid references tutores(id) on delete set null,
  finalidad        finalidad_consentimiento not null,
  otorgado         boolean not null,
  fecha            date not null default current_date,
  metodo           metodo_consentimiento not null default 'formulario_fisico',
  -- Qué versión del aviso / formulario aceptó la familia.
  texto_version    text,
  -- Escaneo del formulario firmado (en el bucket `documentos`).
  documento_id     uuid references documentos(id) on delete set null,
  -- Snapshot de quién firma, por si el registro del tutor cambia después.
  firmante_nombre  text,
  firmante_dpi     text,
  revocado_en      date,
  revocado_motivo  text,
  vence_en         date,
  notas            text,
  creado_por       uuid references perfiles(id) on delete set null,
  creado_en        timestamptz not null default now(),

  constraint consentimiento_revocacion_valida
    check (revocado_en is null or revocado_en >= fecha)
);

create index consentimientos_jugador_idx
  on consentimientos (jugador_id, finalidad, creado_en desc);

comment on table consentimientos is
  'Bitácora inmutable de consentimientos por finalidad. Para cambiar un permiso se inserta una fila nueva.';

alter table consentimientos enable row level security;

-- Lectura: todo el personal de la academia (necesita saber qué se puede usar);
-- y el tutor sobre sus hijos (portal futuro).
create policy consentimiento_lectura on consentimientos
  for select to authenticated
  using (
    exists (
      select 1 from jugadores j
       where j.id = jugador_id
         and j.academia_id = mi_academia()
         and (es_admin() or mi_rol() = 'entrenador' or es_mi_hijo(j.id))
    )
  );

-- Escritura: solo director y coordinador. Sin UPDATE ni DELETE (es bitácora).
create policy consentimiento_escritura on consentimientos
  for insert to authenticated
  with check (
    es_admin()
    and exists (
      select 1 from jugadores j
       where j.id = jugador_id and j.academia_id = mi_academia()
    )
  );

create trigger tg_auditoria_consentimientos
  after insert or update or delete on consentimientos
  for each row execute function fn_auditoria();

-- Estado VIGENTE por (jugador, finalidad): la fila más reciente, y si sigue
-- valiendo hoy (otorgada, no revocada, no vencida).
create or replace view v_consentimiento_vigente
with (security_invoker = on) as
select distinct on (c.jugador_id, c.finalidad)
  c.jugador_id,
  c.finalidad,
  c.otorgado,
  c.fecha,
  c.revocado_en,
  c.vence_en,
  c.firmante_nombre,
  c.tutor_id,
  c.documento_id,
  (
    c.otorgado
    and c.revocado_en is null
    and (c.vence_en is null or c.vence_en >= current_date)
  ) as vigente
from consentimientos c
order by c.jugador_id, c.finalidad, c.creado_en desc;

comment on view v_consentimiento_vigente is
  'El consentimiento efectivo de cada jugador por finalidad, hoy.';

-- ============================================================================
--  Backfill conservador del booleano viejo.
--  autoriza_uso_imagen = true  ->  P1 (ficha interna) otorgado.
--  NO se asume que ese "sí" cubría redes sociales ni prensa: esas quedan
--  pendientes de re-confirmar con la familia por finalidad.
-- ============================================================================
insert into consentimientos
  (jugador_id, finalidad, otorgado, fecha, metodo, notas, creado_en)
select
  j.id, 'p1_ficha', true,
  coalesce(j.fecha_autorizacion, j.creado_en::date),
  'formulario_fisico',
  'Migrado del campo autoriza_uso_imagen. Re-confirmar con la familia por finalidad (ficha / admin / redes / prensa).',
  now()
from jugadores j
where j.autoriza_uso_imagen is true;

-- ============================================================================
--  Bitácora de accesos a fotos de menores — quién vio o descargó la foto.
-- ============================================================================
create table accesos_media (
  id          uuid primary key default gen_random_uuid(),
  jugador_id  uuid not null references jugadores(id) on delete cascade,
  usuario_id  uuid references perfiles(id) on delete set null,
  tipo        text not null default 'foto',
  proposito   text not null default 'ver_ficha',  -- ver_ficha | descarga | difusion
  creado_en   timestamptz not null default now()
);

create index accesos_media_jugador_idx on accesos_media (jugador_id, creado_en desc);

alter table accesos_media enable row level security;

-- Lo revisa solo el director (como la auditoría).
create policy acceso_media_lectura on accesos_media
  for select to authenticated
  using (
    es_director()
    and exists (
      select 1 from jugadores j
       where j.id = jugador_id and j.academia_id = mi_academia()
    )
  );

-- Cada usuario registra su propio acceso.
create policy acceso_media_escritura on accesos_media
  for insert to authenticated
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from jugadores j
       where j.id = jugador_id and j.academia_id = mi_academia()
    )
  );
