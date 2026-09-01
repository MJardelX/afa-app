-- ============================================================================
--  AFA MANAGER — Esquema inicial (v1.0)
--  Academia de Fútbol Amistad
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ============================================================================
--  ENUMS
-- ============================================================================

create type rol_usuario        as enum ('director', 'coordinador', 'entrenador', 'tutor');
create type estado_jugador     as enum ('activo', 'inactivo', 'retirado', 'egresado');
create type parentesco         as enum ('padre', 'madre', 'encargado', 'otro');
create type estado_inscripcion as enum ('activa', 'baja', 'trasladado');
create type tipo_sesion        as enum ('entrenamiento', 'partido', 'amistoso', 'torneo');
create type estado_sesion      as enum ('programada', 'realizada', 'suspendida', 'cancelada');
create type estado_asistencia  as enum ('presente', 'tarde', 'justificado', 'ausente');
create type dimension_criterio as enum ('tecnica', 'tactica', 'fisica', 'actitudinal');
create type estado_evaluacion  as enum ('borrador', 'finalizada');
create type tipo_documento     as enum (
  'partida_nacimiento', 'dpi_tutor', 'ficha_medica', 'autorizacion', 'fotografia', 'otro'
);

-- ============================================================================
--  NÚCLEO
-- ============================================================================

create table academias (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  nombre_corto   text,
  prefijo_codigo text not null default 'AFA',
  logo_url       text,
  color_primario   text default '#1e3a8a',
  color_secundario text default '#facc15',
  direccion      text,
  telefono       text,
  email          text,
  activa         boolean not null default true,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table academias is
  'Multi-tenant desde el día uno. Hoy solo existe AFA; toda tabla lleva academia_id.';

-- Usuarios del sistema, enlazados a Supabase Auth.
create table perfiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  academia_id    uuid not null references academias(id) on delete cascade,
  nombre_completo text not null,
  rol            rol_usuario not null default 'entrenador',
  telefono       text,
  foto_url       text,
  activo         boolean not null default true,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index perfiles_academia_idx on perfiles (academia_id);

-- Ciclo lectivo / deportivo. Eje de todo el histórico.
create table temporadas (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias(id) on delete cascade,
  nombre        text not null,
  anio          int  not null,
  fecha_inicio  date not null,
  fecha_fin     date not null,
  activa        boolean not null default false,
  cerrada       boolean not null default false,
  creado_en     timestamptz not null default now(),
  constraint temporada_fechas_validas check (fecha_fin > fecha_inicio),
  unique (academia_id, nombre)
);

-- Solo una temporada activa por academia.
create unique index temporada_activa_unica
  on temporadas (academia_id) where activa;

-- ============================================================================
--  NIVEL 1 — CATEGORÍA (catálogo permanente, no cambia de año a año)
-- ============================================================================

create table categorias (
  id          uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  nombre      text not null,
  edad_min    int  not null,
  edad_max    int  not null,
  orden       int  not null default 0,
  activa      boolean not null default true,
  creado_en   timestamptz not null default now(),
  constraint categoria_rango_valido check (edad_max >= edad_min and edad_min >= 3),
  unique (academia_id, nombre)
);

comment on column categorias.edad_min is
  'Edad DEPORTIVA mínima (año de temporada - año de nacimiento), no edad real.';

-- Impide que dos categorías activas se traslapen en rango de edad.
alter table categorias add constraint categorias_sin_traslape
  exclude using gist (
    academia_id with =,
    int4range(edad_min, edad_max, '[]') with &&
  ) where (activa);

-- ============================================================================
--  NIVEL 2 — EQUIPO (una categoría, en una temporada, con su entrenador)
-- ============================================================================

create table equipos (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias(id) on delete cascade,
  temporada_id  uuid not null references temporadas(id) on delete cascade,
  categoria_id  uuid not null references categorias(id) on delete restrict,
  nombre        text not null,
  entrenador_id uuid references perfiles(id) on delete set null,
  auxiliar_id   uuid references perfiles(id) on delete set null,
  dias_entreno  text[],
  hora_entreno  time,
  lugar_entreno text,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now(),
  unique (temporada_id, nombre),
  -- Necesario para la FK compuesta desde inscripciones.
  unique (id, temporada_id)
);

create index equipos_temporada_idx  on equipos (temporada_id);
create index equipos_categoria_idx  on equipos (categoria_id);
create index equipos_entrenador_idx on equipos (entrenador_id);

-- ============================================================================
--  PERSONAS
-- ============================================================================

create table jugadores (
  id                   uuid primary key default gen_random_uuid(),
  academia_id          uuid not null references academias(id) on delete cascade,
  codigo               text not null,
  nombres              text not null,
  apellidos            text not null,
  fecha_nacimiento     date not null,
  lugar_nacimiento     text,
  foto_url             text,
  colegio              text,
  grado_escolar        text,
  direccion            text,
  fecha_ingreso        date not null default current_date,
  estado               estado_jugador not null default 'activo',
  autoriza_uso_imagen  boolean not null default false,
  fecha_autorizacion   date,
  observaciones        text,
  creado_por           uuid references perfiles(id) on delete set null,
  creado_en            timestamptz not null default now(),
  actualizado_en       timestamptz not null default now(),
  -- Cota estática: CURRENT_DATE no es IMMUTABLE y Postgres lo rechaza en un CHECK.
  constraint jugador_nacimiento_valido check (fecha_nacimiento > date '1990-01-01'),
  unique (academia_id, codigo)
);

create index jugadores_academia_idx on jugadores (academia_id);
create index jugadores_estado_idx   on jugadores (academia_id, estado);
create index jugadores_nombre_idx   on jugadores
  using gin (to_tsvector('spanish', nombres || ' ' || apellidos));

comment on column jugadores.fecha_nacimiento is
  'Única fuente de la edad y de la categoría. La edad NUNCA se almacena: se calcula.';

-- Tabla aparte por privacidad: RLS la restringe a director y coordinador.
create table fichas_medicas (
  jugador_id                  uuid primary key references jugadores(id) on delete cascade,
  tipo_sangre                 text,
  alergias                    text,
  enfermedades                text,
  medicamentos                text,
  seguro_medico               text,
  numero_poliza               text,
  contacto_emergencia_nombre  text,
  contacto_emergencia_telefono text,
  contacto_emergencia_parentesco text,
  observaciones               text,
  actualizado_por             uuid references perfiles(id) on delete set null,
  actualizado_en              timestamptz not null default now()
);

comment on table fichas_medicas is
  'Datos sensibles de menores. Separada de jugadores para restringirla por RLS.';

-- Tabla propia: resuelve hermanos y padres con datos compartidos.
create table tutores (
  id          uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  perfil_id   uuid references perfiles(id) on delete set null,
  nombres     text not null,
  apellidos   text not null,
  dpi         text,
  telefono    text,
  telefono_alt text,
  email       text,
  ocupacion   text,
  lugar_trabajo text,
  direccion   text,
  creado_en   timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index tutores_academia_idx on tutores (academia_id);
create index tutores_perfil_idx   on tutores (perfil_id);

comment on column tutores.perfil_id is
  'Enlace opcional a un usuario. Habilita el portal de padres (v2.0).';

create table jugador_tutor (
  jugador_id            uuid not null references jugadores(id) on delete cascade,
  tutor_id              uuid not null references tutores(id) on delete cascade,
  parentesco            parentesco not null,
  es_contacto_principal boolean not null default false,
  autoriza_retiro       boolean not null default true,
  primary key (jugador_id, tutor_id)
);

create index jugador_tutor_tutor_idx on jugador_tutor (tutor_id);

-- Un solo contacto principal por jugador.
create unique index jugador_contacto_principal_unico
  on jugador_tutor (jugador_id) where es_contacto_principal;

-- ============================================================================
--  NIVEL 3 — INSCRIPCIÓN (jugador + temporada + equipo)
-- ============================================================================

create table inscripciones (
  id               uuid primary key default gen_random_uuid(),
  jugador_id       uuid not null references jugadores(id) on delete cascade,
  temporada_id     uuid not null references temporadas(id) on delete cascade,
  equipo_id        uuid,
  es_principal     boolean not null default true,
  posicion         text,
  numero_camiseta  int,
  -- Sin DEFAULT a propósito: un trigger la deriva de la temporada y del ingreso
  -- del jugador. Ver fn_inscripcion_fecha_alta().
  fecha_alta       date not null,
  fecha_baja       date,
  motivo_excepcion text,
  estado           estado_inscripcion not null default 'activa',
  creado_por       uuid references perfiles(id) on delete set null,
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now(),

  constraint inscripcion_fechas_validas check (fecha_baja is null or fecha_baja >= fecha_alta),
  constraint inscripcion_camiseta_valida check (numero_camiseta is null or numero_camiseta between 1 and 99),

  -- GUARDA CLAVE: el equipo debe pertenecer a la MISMA temporada.
  -- Con equipo_id NULL la restricción no aplica (jugador inscrito sin equipo).
  foreign key (equipo_id, temporada_id)
    references equipos (id, temporada_id) on delete set null
);

-- Un solo equipo principal por jugador y temporada.
-- Las inscripciones secundarias (convocatoria a otra categoría) no compiten.
create unique index inscripcion_principal_unica
  on inscripciones (jugador_id, temporada_id) where es_principal;

-- Un número de camiseta por equipo, entre inscripciones activas.
create unique index inscripcion_camiseta_unica
  on inscripciones (equipo_id, numero_camiseta)
  where numero_camiseta is not null and estado = 'activa';

create index inscripciones_jugador_idx   on inscripciones (jugador_id);
create index inscripciones_temporada_idx on inscripciones (temporada_id);
create index inscripciones_equipo_idx    on inscripciones (equipo_id);

comment on table inscripciones is
  'Tabla bisagra. La categoría del jugador se lee: inscripcion -> equipo -> categoria.';

-- ============================================================================
--  OPERACIÓN — ASISTENCIA
-- ============================================================================

create table sesiones (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias(id) on delete cascade,
  temporada_id  uuid not null references temporadas(id) on delete cascade,
  equipo_id     uuid not null references equipos(id) on delete cascade,
  tipo          tipo_sesion not null default 'entrenamiento',
  fecha         date not null,
  hora_inicio   time,
  hora_fin      time,
  lugar         text,
  rival         text,
  goles_favor   int,
  goles_contra  int,
  estado        estado_sesion not null default 'programada',
  notas         text,
  registrada_por uuid references perfiles(id) on delete set null,
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint sesion_marcador_valido check (
    (goles_favor is null and goles_contra is null) or tipo <> 'entrenamiento'
  )
);

create index sesiones_equipo_fecha_idx on sesiones (equipo_id, fecha desc);
create index sesiones_temporada_idx    on sesiones (temporada_id, fecha desc);

comment on table sesiones is
  'Sesiones ilimitadas. Sustituye las columnas fijas de "8 entrenamientos y 4 partidos".';

create table asistencias (
  id             uuid primary key default gen_random_uuid(),
  sesion_id      uuid not null references sesiones(id) on delete cascade,
  jugador_id     uuid not null references jugadores(id) on delete cascade,
  estado         estado_asistencia not null,
  minutos_jugados int,
  goles          int not null default 0,
  asistencias_gol int not null default 0,
  observacion    text,
  registrada_por uuid references perfiles(id) on delete set null,
  registrada_en  timestamptz not null default now(),
  unique (sesion_id, jugador_id),
  constraint asistencia_minutos_validos check (minutos_jugados is null or minutos_jugados between 0 and 120)
);

create index asistencias_jugador_idx on asistencias (jugador_id);
create index asistencias_sesion_idx  on asistencias (sesion_id);

-- ============================================================================
--  EVALUACIÓN
-- ============================================================================

create table periodos_evaluacion (
  id           uuid primary key default gen_random_uuid(),
  temporada_id uuid not null references temporadas(id) on delete cascade,
  nombre       text not null,
  fecha_inicio date not null,
  fecha_fin    date not null,
  cerrado      boolean not null default false,
  orden        int not null default 0,
  unique (temporada_id, nombre),
  constraint periodo_fechas_validas check (fecha_fin > fecha_inicio)
);

-- Criterios configurables: los 10 ítems viven como filas, no como columnas.
create table criterios_evaluacion (
  id                  uuid primary key default gen_random_uuid(),
  academia_id         uuid not null references academias(id) on delete cascade,
  dimension           dimension_criterio not null,
  nombre              text not null,
  descripcion         text,
  rubrica             jsonb,
  peso                numeric(4,2) not null default 1.00,
  escala_max          int not null default 5,
  orden               int not null default 0,
  activo              boolean not null default true,
  unique (academia_id, nombre),
  constraint criterio_peso_valido check (peso > 0),
  constraint criterio_escala_valida check (escala_max between 3 and 10)
);

comment on column criterios_evaluacion.rubrica is
  'Anclas de texto por puntaje: {"1":"...","2":"...",...}. Sin rúbrica la evaluación es ruido.';

create table evaluaciones (
  id                uuid primary key default gen_random_uuid(),
  jugador_id        uuid not null references jugadores(id) on delete cascade,
  periodo_id        uuid not null references periodos_evaluacion(id) on delete cascade,
  evaluador_id      uuid not null references perfiles(id) on delete restrict,
  equipo_id         uuid references equipos(id) on delete set null,
  fecha             date not null default current_date,
  comentario_general text,
  estado            estado_evaluacion not null default 'borrador',
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now(),
  unique (jugador_id, periodo_id, evaluador_id)
);

create index evaluaciones_jugador_idx on evaluaciones (jugador_id);
create index evaluaciones_periodo_idx on evaluaciones (periodo_id);

create table evaluacion_detalle (
  evaluacion_id uuid not null references evaluaciones(id) on delete cascade,
  criterio_id   uuid not null references criterios_evaluacion(id) on delete restrict,
  puntaje       numeric(4,2) not null,
  comentario    text,
  primary key (evaluacion_id, criterio_id),
  constraint puntaje_positivo check (puntaje >= 0)
);

-- ============================================================================
--  SOPORTE
-- ============================================================================

create table documentos (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias(id) on delete cascade,
  jugador_id    uuid references jugadores(id) on delete cascade,
  tipo          tipo_documento not null,
  nombre        text not null,
  storage_path  text not null,
  mime_type     text,
  tamano_bytes  bigint,
  subido_por    uuid references perfiles(id) on delete set null,
  subido_en     timestamptz not null default now()
);

create index documentos_jugador_idx on documentos (jugador_id);

-- Correlativo del código de jugador, por academia y año.
create table correlativos (
  academia_id uuid not null references academias(id) on delete cascade,
  anio        int  not null,
  ultimo      int  not null default 0,
  primary key (academia_id, anio)
);
