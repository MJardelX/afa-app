# AFA MANAGER

Sistema de gestión deportiva de la **Academia de Fútbol Amistad**.
Next.js (App Router) para frontend y backend, Supabase para base de datos, auth y archivos.

## Stack

| Pieza      | Versión | Nota                              |
| ---------- | ------- | --------------------------------- |
| Next.js    | 16.3.0  | App Router + Turbopack            |
| React      | 19.2.8  | Server Components por defecto     |
| TypeScript | 5.x     | `strict` activado                 |
| Tailwind   | 4.x     | vía `@tailwindcss/postcss`        |
| Supabase   | Postgres 17 | RLS, Auth y Storage           |

## Arranque

```bash
npm install
cp .env.example .env.local

npm run db:start    # levanta Postgres + Auth + Storage en Docker
npm run dev         # http://localhost:3000
```

`npm run db:start` imprime las llaves locales; van en `.env.local`.
Studio queda en http://127.0.0.1:54423 (los puertos son propios de este
proyecto para no chocar con otros Supabase locales).

| Script            | Qué hace                                             |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo en el puerto 3000             |
| `npm run db:reset`| Reaplica todas las migraciones + `seed.sql`          |
| `npm run db:types`| Regenera `src/types/database.ts` desde el esquema     |
| `npm run lint`    | ESLint                                               |

> Después de tocar una migración: `npm run db:reset && npm run db:types`.

---

# Sistema de diseño

Todo vive en [globals.css](src/app/globals.css). Los componentes **no usan
colores crudos**: usan tokens semánticos. Cambiar la marca es editar un archivo.

## Dos capas

**Primitivas** — la paleta: `celeste-50…950`, `amarillo-100…700`. No se usan
directo en componentes.

**Semánticas** — qué significa cada color. Es lo que se escribe al construir:

| Token | Para qué |
| --- | --- |
| `fondo` · `superficie` · `superficie-2` | Página, tarjetas, zonas sutiles |
| `texto` · `tenue` · `suave` | Jerarquía tipográfica |
| `borde` · `borde-fuerte` | Líneas |
| `marca` · `marca-hover` · `marca-texto` | Acción principal |
| `marca-sutil` · `marca-legible` | Fondo suave / texto de marca |
| `acento` · `acento-texto` | Amarillo como superficie |
| `exito` · `alerta` · `peligro` (+ `-fondo`) | Estados |
| `semaforo-verde/amarillo/rojo` | Asistencia: ≥85 · ≥70 · <70 |

Se usan como utilidades normales: `bg-superficie`, `text-tenue`,
`border-borde`, `bg-marca text-marca-texto`.

## Temas: cada token se define una sola vez

```css
--fondo: light-dark(#ffffff, #0a2333);
```

`light-dark()` lleva los dos valores juntos, así que no hay bloques claro/oscuro
duplicados que se desincronicen. Quién decide lo resuelve `color-scheme`:

- Sin `data-theme` → sigue al sistema operativo.
- `data-theme="light"` o `"dark"` en `<html>` → gana la elección del usuario.

El control está en [tema-toggle.tsx](src/components/ui/tema-toggle.tsx) (claro /
sistema / oscuro, persistido en `localStorage`). Un script inline en
[layout.tsx](src/app/layout.tsx) lo aplica **antes de pintar**: sin eso, quien
elige oscuro ve un destello blanco en cada carga.

`dark:` está redefinido con `@custom-variant` para atender también a
`data-theme`. El de Tailwind solo mira `prefers-color-scheme` e ignoraría la
elección manual.

## Reglas de contraste, medidas y no supuestas

- **`--marca` es celeste-700** (6.11:1 con blanco) y no se aclara en modo
  oscuro: celeste-600 baja a 4.27:1 y no pasa AA.
- **Celeste-600 o más claro nunca lleva texto blanco.**
- **Amarillo nunca es texto sobre blanco**, solo superficie de acento con
  `acento-texto` (celeste-900) encima.
- **Nada de blanco translúcido para texto.** `text-white/90` sobre celeste cae a
  3.26:1; el blanco sólido da 6.11:1.

Los 10 textos del login están medidos con WCAG sobre el render real, en claro y
en oscuro. Todos pasan AA.

## Semáforo de asistencia: no es verde/amarillo/rojo

`buena ≥85 · regular ≥70 · baja <70`, pero con **teal / ámbar / carmín**.

La tríada clásica está descartada por medición: verde y amarillo quedan a
**ΔE 3.6 en protanopia** — un entrenador con daltonismo rojo-verde no distingue
"buena" de "regular", que es justo la lectura principal del sistema. Teal/ámbar/
carmín da **ΔE 21.1** en la misma prueba.

Aun así el color **nunca comunica solo**:
[estado-asistencia.tsx](src/components/ui/estado-asistencia.tsx) siempre pinta
ícono propio + etiqueta escrita + porcentaje.

La vista `v_ranking_equipo` devuelve `nivel_asistencia` (`buena`/`regular`/
`baja`), no un nombre de color: si la base dijera "verde", tarde o temprano
alguien pintaría un verde.

## Gráficas

Una serie = un color. Las barras de "jugadores por categoría" son todas
`--grafico-barra`: pintar cada categoría distinto sugeriría que el color
significa algo, y la longitud ya lleva toda la información. Cada barra lleva su
valor escrito, así que se lee sin depender del color ni del mouse.

## Vidrio (liquid glass)

Clases `.vidrio` y `.campo-vidrio`. Se usan **con moderación** — la tarjeta de
sesión y sus campos — porque el efecto solo se percibe si hay color difuminado
detrás. Por eso existen los halos (`.halos`, `.halo-a/b/c`): son lo que el
desenfoque refracta. Sobre blanco plano el vidrio no se ve y solo cuesta
rendimiento.

Tres salvaguardas: sin soporte de `backdrop-filter` el fondo queda sólido;
con `prefers-reduced-transparency` se desactiva el desenfoque; y el contraste se
mide sobre el resultado.

---

# Modelo de datos

## La decisión central: la categoría no se guarda, se calcula

Un jugador Sub-10 este año es Sub-11 el siguiente. Si la categoría fuera una
columna en `jugadores`, cada 1 de enero quedaría mal en todos los registros a la
vez, y el histórico del año anterior se destruiría al corregirla.

En su lugar hay **tres niveles**:

```
CATEGORÍA        Sub-10                       catálogo permanente, define el rango de edad
   ↓
EQUIPO           Sub-10 "A" — Ciclo 2026      categoría + temporada + entrenador
   ↓
INSCRIPCIÓN      Juan Pérez → Sub-10 "A"      jugador + temporada + equipo
                 Ciclo 2026, #7, delantero
```

La categoría se lee bajando la cadena: `inscripcion → equipo → categoria`.

## Dos edades distintas

- **Edad real** — la del cumpleaños. Para la ficha, el carné y los cumpleaños.
- **Edad deportiva** — los años que cumple *durante* el año de temporada. Define
  la categoría, siguiendo la convención del fútbol formativo (por año de
  nacimiento, no por cumpleaños).

```
edad_deportiva = año_de_temporada − año_de_nacimiento
```

Un niño nacido el 20/11/2016 tiene 9 años reales en agosto de 2026, pero su edad
deportiva en el Ciclo 2026 es 10 → juega Sub-10.

## Consultar la categoría

La vista `v_jugadores` la entrega como si fuera una columna guardada:

```ts
const { data } = await supabase.from("v_jugadores").select("*");

data[0].categoria           // 'Sub-10'  — donde realmente juega
data[0].categoria_por_edad  // 'Sub-10'  — la que le corresponde
data[0].edad_real           // 9
data[0].edad_deportiva      // 10
data[0].fuera_de_categoria  // false     — bandera automática de excepción
```

Cuando un jugador se adelanta o se atrasa de categoría, ambas columnas difieren y
`fuera_de_categoria` se enciende sola. `inscripciones.motivo_excepcion` guarda el
porqué.

## Tablas

```
NÚCLEO
  academias              multi-tenant desde el día uno; toda tabla lleva academia_id
  perfiles               usuarios enlazados a auth.users, con rol
  temporadas             ciclo lectivo; solo una activa por academia

ESTRUCTURA DEPORTIVA
  categorias             Sub-6 … Sub-18, con rango de edad deportiva
  equipos                una categoría en una temporada, con entrenador

PERSONAS
  jugadores              datos permanentes; la edad NUNCA se almacena
  fichas_medicas         1:1, tabla aparte porque RLS la restringe
  tutores                tabla propia: resuelve hermanos y datos compartidos
  jugador_tutor          N:N con parentesco y contacto principal
  inscripciones          jugador + temporada + equipo  ← tabla bisagra

OPERACIÓN
  sesiones               entrenamientos y partidos, sin límite de cantidad
  asistencias            una fila por jugador y sesión

EVALUACIÓN
  periodos_evaluacion    sin período no hay línea de progreso
  criterios_evaluacion   los criterios son filas configurables, no columnas
  evaluaciones           quién evaluó, cuándo, en qué período
  evaluacion_detalle     puntaje por criterio

SOPORTE
  documentos             partidas, DPI, fichas firmadas (Supabase Storage)
  auditoria              bitácora de cambios; solo el director la consulta
  correlativos           código AFA-2026-0001
```

## Vistas

| Vista                   | Para qué                                                     |
| ----------------------- | ------------------------------------------------------------ |
| `v_jugadores`           | Jugadores de la temporada activa con categoría y ambas edades |
| `v_asistencia_jugador`  | Convocadas, presentes, porcentaje                            |
| `v_ranking_equipo`      | Ranking, semáforo (verde ≥85, amarillo ≥70, rojo <70)        |
| `v_evaluacion_dimension`| Promedio ponderado por dimensión                             |

Todas con `security_invoker = on`: la RLS del usuario aplica también dentro de la
vista.

## Nada calculado se almacena

Edad, porcentaje de asistencia, promedio y semáforo se derivan siempre. Guardar
un cálculo es garantizar que algún día quede desactualizado.

## Guardas en la base de datos

Errores que el sistema hace **imposibles**, no solo improbables:

| Guarda | Qué impide |
| --- | --- |
| FK compuesta `(equipo_id, temporada_id)` | Inscribir a un jugador en un equipo de otra temporada |
| Índice parcial `temporada_activa_unica` | Dos temporadas activas a la vez |
| `EXCLUDE` sobre rangos de edad | Dos categorías activas con edades traslapadas |
| `inscripcion_principal_unica` | Dos equipos principales en la misma temporada |
| `inscripcion_camiseta_unica` | Número de camiseta repetido en un equipo |
| `fn_validar_asistencia()` | Asistencia de un jugador no inscrito, o anterior a su alta |
| `fn_inscripcion_fecha_alta()` | Que el alta caiga "hoy" y se pierda el ciclo ya transcurrido |

`fecha_alta` se deriva como `greatest(inicio_temporada, ingreso_a_la_academia)`.
Por eso quien entra en octubre no arrastra un porcentaje bajo por las sesiones de
marzo: su denominador solo cuenta las sesiones posteriores a su alta.

## Roles y permisos

| Rol           | Alcance                                                            |
| ------------- | ------------------------------------------------------------------ |
| `director`    | Todo lo de su academia, incluida la bitácora de auditoría          |
| `coordinador` | Igual, sin acceso a auditoría                                      |
| `entrenador`  | Sus equipos: sesiones, asistencia y evaluaciones. **Sin ficha médica** |
| `tutor`       | Solo sus hijos, y solo evaluaciones finalizadas (portal v2.0)      |
| `anon`        | Nada. Una petición sin sesión recibe 401, no una lista vacía       |

La ficha médica vive en tabla aparte precisamente para poder negársela al
entrenador: son datos de salud de menores de edad.

## Renovación de temporada

`preview_renovacion(temporada_destino)` simula el cambio de ciclo sin escribir
nada: cada jugador sube de categoría solo, marca a los que egresan y señala a los
que estaban fuera de categoría para que el director confirme.

---

# Autenticación

Funciona íntegramente en local: GoTrue corre en el stack de Docker y los correos
salientes quedan en Mailpit (http://127.0.0.1:54424), sin salir a internet.

## Nadie se registra solo

`enable_signup = false` en `config.toml`: el endpoint público de registro está
cerrado. Las cuentas las crea la dirección por la Admin API.

```bash
curl -X POST http://127.0.0.1:54421/auth/v1/admin/users \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"entrenador@afa.gt","password":"...","email_confirm":true,
       "user_metadata":{"nombre_completo":"Prof. Méndez","rol":"entrenador"}}'
```

El `rol` en `user_metadata` es lo que hace que el perfil nazca **activo**. Un
usuario creado por cualquier otra vía nace inactivo, y como `mi_academia()` y
`mi_rol()` filtran por `activo`, no pasa ninguna política: no ve un solo
jugador aunque tenga un JWT válido. Son dos capas independientes a propósito.

Para activar a alguien o cambiarle el rol:

```sql
update perfiles set activo = true, rol = 'entrenador' where id = '<uuid>';
```

## Dos detalles del CLI que cuestan tiempo

- `[auth.email].enable_signup` **no** controla el registro: el CLI lo mapea a
  `GOTRUE_EXTERNAL_EMAIL_ENABLED`, así que ponerlo en `false` apaga el login por
  correo entero. El que bloquea el registro es `[auth].enable_signup`.
- Cambiar `config.toml` requiere `supabase stop && supabase start`.
  `supabase db reset` **no** recarga la configuración de Auth.

## Y uno de GoTrue

La Admin API **no valida** `minimum_password_length`. Al crear usuarios desde la
app hay que validar el largo en el formulario, o mejor, mandar invitación para
que cada quien fije su propia contraseña (ese flujo sí valida).

## Rutas

| Ruta | Sin sesión |
| --- | --- |
| `/login` | accesible |
| `/api/health` | accesible |
| Cualquier página | 307 → `/login` |
| Cualquier `/api/*` | **401 JSON**, no redirección |

Las rutas de API responden 401 en JSON a propósito: redirigirlas devolvería HTML
a un `fetch()`, imposible de manejar en el cliente.

El middleware usa `getUser()`, no `getSession()`: el segundo lee la cookie sin
verificarla contra Supabase, y en el servidor eso no es confiable.

---

## Aplicar a Supabase hospedado

```bash
npx supabase link --project-ref <tu-project-ref>
npx supabase db push
```

Luego pega `supabase/seed.sql` en el SQL Editor y actualiza `.env.local` con la
URL y la anon key de *Project Settings → API*.

## Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/                    endpoints propios (los que no cubre PostgREST)
├── components/
├── lib/
│   ├── supabase/
│   │   ├── client.ts           Client Components
│   │   ├── server.ts           Server Components y Route Handlers
│   │   └── middleware.ts       refresco de sesión y rutas protegidas
│   ├── env.ts
│   └── utils.ts
├── server/                     lógica de negocio (solo servidor)
└── types/
    ├── database.ts             GENERADO — no editar a mano
    └── index.ts

supabase/
├── migrations/
│   ├── 20260803120000_esquema_inicial.sql
│   ├── 20260803120100_funciones_y_vistas.sql
│   ├── 20260803120200_rls.sql
│   ├── 20260803120300_auditoria_y_storage.sql
│   └── 20260803120400_permisos.sql
└── seed.sql                    academia, ciclo 2026, categorías, criterios
```

## Siguiente etapa

Etapa 0 (fundaciones de base de datos) está cerrada y verificada. Sigue:
login y layout con menú → catálogos → jugadores → inscripciones → asistencia →
evaluación → dashboard.
