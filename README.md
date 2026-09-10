# AFA MANAGER

Sports management system for the **Amistad Football Academy** (Academia de
Fútbol Amistad). Next.js (App Router) for frontend and backend, Supabase for
database, auth and files.

## Stack

| Piece      | Version     | Note                           |
| ---------- | ----------- | ------------------------------ |
| Next.js    | 16.3.0      | App Router + Turbopack         |
| React      | 19.2.8      | Server Components by default   |
| TypeScript | 5.x         | `strict` on                    |
| Tailwind   | 4.x         | via `@tailwindcss/postcss`     |
| next-intl  | 4.x         | UI in English, Spanish available |
| lucide-react | 1.x       | Icon set (tree-shaken per import) |
| Supabase   | Postgres 17 | RLS, Auth and Storage          |

## Getting started

```bash
npm install
cp .env.example .env.local

npm run db:start    # brings up Postgres + Auth + Storage in Docker
npm run dev         # http://localhost:3000
```

`npm run db:start` prints the local keys; they go in `.env.local`.
Studio is at http://127.0.0.1:54423 (the ports are specific to this project so
they don't clash with other local Supabase stacks).

| Script            | What it does                                          |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Dev server on port 3000                              |
| `npm run db:reset`| Re-applies every migration + `seed.sql`              |
| `npm run db:users`| Creates/resets the local test users (Admin API)     |
| `npm run db:types`| Regenerates `src/types/database.ts` from the schema |
| `npm run lint`    | ESLint                                               |

> After touching a migration: `npm run db:reset && npm run db:types`.

---

# Internationalization

The UI is in **English by default**, with a full **Spanish** translation. There
are no locale-prefixed URLs: the language is a user preference, not a routing
concern.

- `src/i18n/config.ts` — supported locales and the cookie name.
- `src/i18n/request.ts` — per-request locale resolution (from the `afa-locale`
  cookie, falling back to English).
- `src/i18n/actions.ts` — `setLocale()` server action that persists the choice.
- `messages/en.json`, `messages/es.json` — the message catalogs.

Server Components and Server Actions read strings with `getTranslations()`;
Client Components use `useTranslations()`. The language switcher is
[language-toggle.tsx](src/components/ui/language-toggle.tsx), shown next to the
theme switcher.

Database identifiers (table and column names, enum values) stay in Spanish:
they are the data layer's contract, mirrored verbatim by the generated
`src/types/database.ts`.

---

# Design system

Everything lives in [globals.css](src/app/globals.css). Components **do not use
raw colors**: they use semantic tokens. Rebranding is editing one file.

## Two layers

**Primitives** — the palette: `sky-50…950`, `yellow-100…700`. Never used
directly in components.

**Semantic** — what each color means. This is what you write with:

| Token | For |
| --- | --- |
| `canvas` · `surface` · `surface-2` | Page, cards, subtle zones |
| `fg` · `muted` · `faint` | Type hierarchy |
| `line` · `line-strong` | Lines |
| `brand` · `brand-hover` · `brand-fg` | Primary action |
| `brand-subtle` · `brand-legible` | Soft brand background / brand text |
| `accent` · `accent-fg` · `accent-subtle` | Yellow as a surface |
| `success` · `warning` · `danger` (+ `-bg`) | States |
| `status-good` / `status-fair` / `status-low` (+ `-bg` / `-fg`) | Attendance: ≥85 · ≥70 · <70 |
| `chart-bar` · `chart-track` | Charts |
| `banner-from` · `banner-via` · `banner-to` · `banner-fg` | The dashboard brand banner |

They are used as normal utilities: `bg-surface`, `text-muted`,
`border-line`, `bg-brand text-brand-fg`.

**Elevation** is tokenized too, theme-aware: `shadow-card` (resting),
`shadow-card-hover` (lift on interactive cards), `shadow-pop` (the banner).
Radii top out at `rounded-3xl`; `ease-out-soft` is the shared easing for
hover motion. `--canvas` is a hair off-white so white `surface` cards separate
cleanly without heavy borders.

## Themes: every token is defined once

```css
--canvas: light-dark(#ffffff, #0a2333);
```

`light-dark()` carries both values together, so there are no duplicated
light/dark blocks that drift apart. `color-scheme` decides which one applies:

- No `data-theme` → follows the operating system.
- `data-theme="light"` or `"dark"` on `<html>` → the user's choice wins.

The control is [theme-toggle.tsx](src/components/ui/theme-toggle.tsx) (light /
system / dark, persisted in `localStorage` under `afa-theme`). An inline script
in [layout.tsx](src/app/layout.tsx) applies it **before paint**: without it,
someone who chose dark sees a white flash on every load.

`dark:` is redefined with `@custom-variant` so it also honors `data-theme`.
Tailwind's own only looks at `prefers-color-scheme` and would ignore the manual
choice.

## Contrast rules, measured and not assumed

- **`--brand` is sky-700** (6.11:1 on white) and is not lightened in dark mode:
  sky-600 drops to 4.27:1 and fails AA.
- **Sky-600 or lighter never carries white text.**
- **Yellow is never text on white**, only an accent surface with `accent-fg`
  (sky-900) on top.
- **No translucent white for text.** `text-white/90` over sky falls to 3.26:1;
  solid white is 6.11:1.

The 10 login texts are measured with WCAG against the real render, light and
dark. They all pass AA.

## Attendance scale: not green/yellow/red

`good ≥85 · fair ≥70 · low <70`, but with **teal / amber / crimson**.

The classic triad is ruled out by measurement: green and yellow land at
**dE 3.6 in protanopia** — a coach with red-green colorblindness can't tell
"good" from "fair", which is the system's main read. Teal/amber/crimson gives
**dE 21.1** on the same test.

Even so the color **never communicates alone**:
[attendance-badge.tsx](src/components/ui/attendance-badge.tsx) always renders its
own icon + a written label + the percentage.

The `v_ranking_equipo` view returns `nivel_asistencia` (`buena`/`regular`/
`baja`), not a color name: if the database said "green", sooner or later someone
would paint a green.

## Charts

One series = one color. The "players by category" bars are all `chart-bar`:
painting each category differently would suggest the color means something, and
the length already carries all the information. Each bar has its value written,
so it reads without relying on the color or the mouse.

## Glass (liquid glass)

Classes `.glass` and `.field-glass`. Used **sparingly** — the session card and
its fields — because the effect is only perceptible with diffuse color behind
it. That is why the halos exist (`.halos`, `.halo-a/b/c`): they are what the
blur refracts. Over flat white the glass is invisible and only costs
performance.

Three safeguards: without `backdrop-filter` support the background stays solid;
with `prefers-reduced-transparency` the blur is disabled; and contrast is
measured on the result.

---

# Data model

## The central decision: the category is not stored, it is computed

A Sub-10 player this year is Sub-11 the next. If the category were a column in
`jugadores`, every January 1st it would be wrong across every record at once,
and the previous year's history would be destroyed when correcting it.

Instead there are **three levels**:

```
CATEGORY         Sub-10                       permanent catalog, defines the age range
   ↓
TEAM             Sub-10 "A" — Ciclo 2026      category + season + coach
   ↓
REGISTRATION     Juan Pérez → Sub-10 "A"      player + season + team
                 Ciclo 2026, #7, forward
```

The category is read by walking down the chain:
`inscripcion → equipo → categoria`.

## Two different ages

- **Real age** — from the birthday. For the profile, the ID card and birthdays.
- **Sporting age** — the years reached *during* the season year. Defines the
  category, following youth-football convention (by birth year, not by
  birthday).

```
sporting_age = season_year − birth_year
```

A child born on 2016-11-20 is 9 years old in August 2026, but their sporting age
in Ciclo 2026 is 10 → they play Sub-10.

## Querying the category

The `v_jugadores` view delivers it as if it were a stored column:

```ts
const { data } = await supabase.from("v_jugadores").select("*");

data[0].categoria           // 'Sub-10'  — where they actually play
data[0].categoria_por_edad  // 'Sub-10'  — where they belong
data[0].edad_real           // 9
data[0].edad_deportiva      // 10
data[0].fuera_de_categoria  // false     — automatic exception flag
```

When a player is moved up or down a category, both columns differ and
`fuera_de_categoria` turns on by itself. `inscripciones.motivo_excepcion` stores
the why.

## Tables

```
CORE
  academias              multi-tenant from day one; every table carries academia_id
  perfiles               users linked to auth.users, with a role
  temporadas             school cycle; only one active per academy

SPORTING STRUCTURE
  categorias             Sub-6 … Sub-18, with a sporting-age range
  equipos                one category in one season, with a coach

PEOPLE
  jugadores              permanent data; age is NEVER stored
  fichas_medicas         1:1, a separate table because RLS restricts it
  tutores                own table: handles siblings and shared data
  jugador_tutor          N:N with relationship and primary contact
  inscripciones          player + season + team  ← hinge table

OPERATION
  sesiones               trainings and matches, no cap on quantity
  asistencias            one row per player and session

ASSESSMENT
  periodos_evaluacion    without a period there is no progress line
  criterios_evaluacion   criteria are configurable rows, not columns
  evaluaciones           who assessed, when, in which period
  evaluacion_detalle     score per criterion

SUPPORT
  documentos             birth certificates, IDs, signed forms (Supabase Storage)
  auditoria              change log; only the director queries it
  correlativos           code AFA-2026-0001
```

## Views

| View                    | For                                                          |
| ----------------------- | ----------------------------------------------------------- |
| `v_jugadores`           | Active-season players with category and both ages           |
| `v_asistencia_jugador`  | Called up, present, percentage                              |
| `v_ranking_equipo`      | Ranking, scale (green ≥85, yellow ≥70, red <70)             |
| `v_evaluacion_dimension`| Weighted average per dimension                              |

All with `security_invoker = on`: the user's RLS applies inside the view too.

## Nothing computed is stored

Age, attendance percentage, average and the scale are always derived. Storing a
computation guarantees it goes stale one day.

## Database guards

Errors the system makes **impossible**, not just unlikely:

| Guard | What it prevents |
| --- | --- |
| Composite FK `(equipo_id, temporada_id)` | Registering a player in a team from another season |
| Partial index `temporada_activa_unica` | Two active seasons at once |
| `EXCLUDE` over age ranges | Two active categories with overlapping ages |
| `inscripcion_principal_unica` | Two primary teams in the same season |
| `inscripcion_camiseta_unica` | A repeated shirt number in a team |
| `fn_validar_asistencia()` | Attendance for an unregistered player, or before their start date |
| `fn_inscripcion_fecha_alta()` | The start date landing "today" and losing the cycle already elapsed |

`fecha_alta` is derived as `greatest(season_start, academy_join_date)`. That is
why someone who joins in October does not drag a low percentage from the March
sessions: their denominator only counts sessions after their start date.

## Roles and permissions

| Role          | Scope                                                             |
| ------------- | ---------------------------------------------------------------- |
| `director`    | Everything in their academy, including the audit log             |
| `coordinador` | Same, without audit access                                       |
| `entrenador`  | Their teams: sessions, attendance and assessments. **No medical record** |
| `tutor`       | Only their children, and only finalized assessments (portal v2.0) |
| `anon`        | Nothing. A request without a session gets 401, not an empty list |

The medical record lives in a separate table precisely so it can be denied to
the coach: it is health data of minors.

## Season rollover

`preview_renovacion(target_season)` simulates the cycle change without writing
anything: every player moves up a category by itself, flags the ones who
graduate and points out the ones who were out of category so the director can
confirm.

---

# Authentication

Works entirely locally: GoTrue runs in the Docker stack and outgoing emails land
in Mailpit (http://127.0.0.1:54424), without reaching the internet.

## Nobody signs up on their own

`enable_signup = false` in `config.toml`: the public sign-up endpoint is closed.
Accounts are created by management through the Admin API.

```bash
curl -X POST http://127.0.0.1:54421/auth/v1/admin/users \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"entrenador@afa.gt","password":"...","email_confirm":true,
       "user_metadata":{"nombre_completo":"Prof. Méndez","rol":"entrenador"}}'
```

The `rol` in `user_metadata` is what makes the profile start **active**. A user
created through any other path starts inactive, and since `mi_academia()` and
`mi_rol()` filter by `activo`, no policy passes: they don't see a single player
even with a valid JWT. Two independent layers on purpose.

To activate someone or change their role:

```sql
update perfiles set activo = true, rol = 'entrenador' where id = '<uuid>';
```

## Two CLI details that cost time

- `[auth.email].enable_signup` does **not** control sign-up: the CLI maps it to
  `GOTRUE_EXTERNAL_EMAIL_ENABLED`, so setting it to `false` turns off email
  login entirely. The one that blocks sign-up is `[auth].enable_signup`.
- Changing `config.toml` requires `supabase stop && supabase start`.
  `supabase db reset` does **not** reload the Auth config.

## And one from GoTrue

The Admin API does **not** validate `minimum_password_length`. When creating
users from the app you must validate the length in the form, or better, send an
invite so each person sets their own password (that flow does validate).

## Routes

| Route | No session |
| --- | --- |
| `/login` | accessible |
| `/api/health` | accessible |
| Any page | 307 → `/login` |
| Any `/api/*` | **401 JSON**, not a redirect |

API routes answer 401 in JSON on purpose: redirecting them would return HTML to
a `fetch()`, impossible to handle on the client.

The proxy uses `getUser()`, not `getSession()`: the latter reads the cookie
without verifying it against Supabase, and on the server that is not
trustworthy.

---

## Apply to hosted Supabase

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Then run `supabase db query --linked -f supabase/seed.sql` (or paste it in the
SQL Editor) and update `.env.local` with the URL and anon key from
*Project Settings → API*.

## Project structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── (app)/                  authenticated area (dashboard + future modules)
│   ├── login/
│   └── api/                    own endpoints (the ones PostgREST doesn't cover)
├── components/
│   ├── app/                    app chrome: sidebar, header, bottom nav, dashboard blocks
│   └── ui/                     reusable primitives: card, button, metric, badges, toggles
├── i18n/
│   ├── config.ts               locales + cookie name
│   ├── request.ts              per-request locale resolution
│   └── actions.ts              setLocale() server action
├── lib/
│   ├── supabase/
│   │   ├── client.ts           Client Components
│   │   ├── server.ts           Server Components and Route Handlers
│   │   └── middleware.ts       session refresh and protected routes
│   ├── env.ts
│   └── utils.ts
├── server/                     business logic (server only)
└── types/
    ├── database.ts             GENERATED — do not edit by hand
    └── index.ts

messages/
├── en.json                     default UI language
└── es.json                     Spanish translation

supabase/
├── migrations/
│   ├── 20260803120000_esquema_inicial.sql
│   ├── 20260803120100_funciones_y_vistas.sql
│   ├── 20260803120200_rls.sql
│   ├── 20260803120300_auditoria_y_storage.sql
│   └── 20260803120400_permisos.sql
└── seed.sql                    academy, ciclo 2026, categories, criteria
```

## Next stage

Stage 0 (database foundations) is closed and verified. Next:
login and layout with menu → catalogs → players → registrations → attendance →
assessment → dashboard.
