# my-plans — Arquitectura técnica

> Plataforma social privada para proponer, organizar y recordar experiencias con amigos:
> montaña, cimas, museos, restaurantes, viajes, ciudades y cualquier otra actividad.

Documento vivo. Recoge la propuesta aprobada en la Fase 1 y las decisiones tomadas después.

---

## 0. Decisiones aprobadas

| Tema | Decisión |
|---|---|
| Entorno local | Docker Desktop + Supabase CLI (BD local, migraciones y pruebas pgTAP). |
| Supabase / Google OAuth | Guía en `docs/setup-supabase-google.md` (Fase 3). |
| Idiomas | Español (por defecto), inglés y catalán desde el primer día (`next-intl`). |
| Visibilidad | `private` · `invited` · `friends`. **Preparado para `public` en el futuro** (ver §6.3). |
| Permisos | En el MVP solo el creador edita, convierte y marca como realizado. **Preparado para co-organizadores** (ver §6.4). |
| Despliegue | Vercel (frontend) + Supabase Cloud (BD, Auth y Storage). |

---

## 1. Arquitectura

| Capa | Tecnología | Motivo |
|---|---|---|
| Framework | **Next.js 16** (App Router) + **TypeScript estricto** | Server Components para leer datos y Server Actions para escribirlos, sin una API REST propia. |
| Sesión | `@supabase/ssr` (cookies) + `src/proxy.ts`¹ | Renueva la sesión, protege las rutas y redirige al onboarding. |
| Lógica crítica | **PostgreSQL**: RLS + funciones RPC + triggers | La seguridad no depende del frontend. Las operaciones de varios pasos son transaccionales. |
| Notificaciones | Generadas por **triggers** | No se pueden falsificar y siempre son coherentes. Preparado para push vía Database Webhooks. |
| Estado | RSC + `revalidatePath` + estado local | Sin store global. La única parte en tiempo real es el contador de notificaciones (Supabase Realtime). |
| UI | Tailwind CSS v4 + shadcn/ui + lucide-react | Componentes accesibles y personalizables. |
| Formularios | React Hook Form + Zod | El **mismo esquema** en el cliente y en el servidor, más `CHECK` en la BD. |
| i18n | `next-intl` (sin prefijo en la URL) | Locale guardado en el perfil y en una cookie. El proxy reescribe internamente a `/[locale]/…` (ver §6.9). Al ser una app privada, no hace falta SEO por idioma. |
| Imágenes | Compresión en el cliente (WebP, 2560 px + miniatura de 480 px), buckets privados, signed URLs | No depende del plan Pro de Supabase y ninguna foto es pública. |
| Fechas | `date-fns` + `@date-fns/tz` | Calendario propio y zonas horarias correctas. |
| Pruebas | pgTAP (RLS) · Vitest (unitarias) · Playwright (E2E) | Las RLS son la seguridad real, así que se prueban directamente en la BD. |
| CI | GitHub Actions: lint, typecheck, Vitest, `supabase test db` | |

¹ En Next 16 `middleware.ts` pasa a llamarse `proxy.ts`.

### Reglas de capas

```
app/ (rutas, layouts)  →  features/<dominio>/components  (UI)
                       →  features/<dominio>/queries.ts  (lectura, solo en servidor)
                       →  features/<dominio>/actions.ts  (escritura: "use server")
                                     ↓
                       lib/supabase/{server,client}.ts   (cliente con la sesión del usuario)
                                     ↓
                       PostgreSQL (RLS + RPC + triggers)
```

* Los componentes nunca llaman a Supabase directamente. Leen con `queries.ts` y escriben con `actions.ts`.
* Patrón de un action: `schema.safeParse → supabase (RLS activa) → mapear error → revalidate → ActionResult<T>`.
* La `service_role` key **no se usa en la app**. Si algún día hace falta, irá solo en módulos `server-only`.
* La paginación es *keyset* (`created_at, id`) para los feeds, el historial, las notificaciones y la galería.

---

## 2. Esquema de base de datos

### 2.1 Tipos enumerados

Los enums de Postgres generan uniones de tipos en TypeScript y se amplían con `ALTER TYPE … ADD VALUE`.

```
visibility          'private' | 'invited' | 'friends'            (+ 'public' en el futuro)
friendship_status   'pending' | 'accepted'
plan_status         'open' | 'scheduled' | 'done' | 'archived'
plan_interest       'pending' | 'interested' | 'not_interested'
event_status        'scheduled' | 'completed' | 'cancelled'
rsvp_status         'pending' | 'going' | 'not_going'
member_role         'host' | 'cohost' | 'guest'
participant_source  'direct' | 'plan'
notification_type   friend_request | friend_accepted | plan_invite | plan_interest
                    | event_invite | event_rsvp | event_updated | event_cancelled
                    | event_completed | photos_added
```

Las **categorías** son una tabla, no un enum, para poder añadir categorías y estadísticas sin migraciones de tipo.

### 2.2 Tablas

```
profiles                         1:1 con auth.users
  id uuid PK → auth.users ON DELETE CASCADE
  username citext UNIQUE NULL    CHECK ^[a-z0-9_]{3,20}$   (NULL hasta el onboarding)
  display_name text NOT NULL, avatar_url, bio (≤280)
  locale ('es'|'en'|'ca') default 'es', timezone default 'Europe/Madrid'
  onboarded_at, created_at, updated_at
  -- el email se queda en auth.users y no se duplica en una tabla visible

friendships                      una fila por pareja
  user_a, user_b → profiles      CHECK (user_a < user_b)   PK (user_a, user_b)
  requested_by → profiles        CHECK (requested_by IN (user_a, user_b))
  status friendship_status, created_at, accepted_at

categories
  id smallint PK, slug UNIQUE, icon, color, stat_key, is_summit bool, sort_order
  seed: hiking · summit · museum · restaurant · trip · city · other
  (los nombres se traducen en la app por slug, no en la BD)

plans                            propuestas sin fecha
  id uuid PK, creator_id → profiles, category_id → categories
  title (1–120), description (≤5000), cover_path, external_url, difficulty (1–5)
  location_name, address, lat, lng, google_place_id
  visibility, status, created_at, updated_at, deleted_at

plan_invitations                 invitación + interés (una sola tabla, sin duplicar)
  plan_id → plans, user_id → profiles     PK (plan_id, user_id)
  invited_by → profiles, role member_role default 'guest' ('cohost' en el futuro)
  interest plan_interest default 'pending', responded_at, created_at

events                           eventos con fecha
  id uuid PK, plan_id → plans NULL ON DELETE SET NULL
  creator_id, category_id, title, description, extra_info, cover_path, external_url
  starts_at timestamptz, ends_at NULL CHECK (ends_at >= starts_at), all_day, timezone
  location_name, address, lat, lng, google_place_id
  visibility default 'invited', status, completed_at, cancelled_at
  created_at, updated_at, deleted_at

event_participants
  event_id → events, user_id → profiles   PK (event_id, user_id)
  role member_role, rsvp rsvp_status, attended bool NULL
  source participant_source, invited_by, responded_at, created_at

peaks                            catálogo compartido de cimas
  id, name, altitude_m, range_name, country, lat, lng, created_by, created_at
  UNIQUE (lower(name), altitude_m)

plan_peaks   (plan_id, peak_id)                        cimas objetivo de una propuesta
event_peaks  (event_id, peak_id, elevation_gain_m, distance_km, difficulty, duration_min)

event_photos                     borrado físico (fila + archivo), por privacidad
  id uuid PK, event_id, uploader_id, storage_path, thumb_path
  width, height, size_bytes, caption, created_at

notifications
  id, recipient_id, actor_id, type notification_type
  entity_type ('profile'|'plan'|'event'), entity_id, data jsonb
  read_at, created_at
  -- el texto se compone en la app con i18n a partir de type + data
```

### 2.3 Índices

* `friendships (user_b, status)`; la PK ya cubre `user_a`.
* `profiles`: GIN trigram sobre `username` y `display_name` (búsqueda).
* `plans (creator_id, status) WHERE deleted_at IS NULL`.
* `plan_invitations (user_id, interest)`.
* `events (starts_at) WHERE deleted_at IS NULL`, `events (plan_id)`.
* `event_participants (user_id, rsvp)`.
* `event_photos (event_id, created_at DESC)`.
* `notifications (recipient_id, created_at DESC)` y un índice parcial `WHERE read_at IS NULL`.

### 2.4 Vistas y funciones

* `completed_participations`: eventos `completed` con `attended = true`. Es **la única fuente de las estadísticas y del historial**. Confirmar asistencia no suma nada.
* `get_user_stats(user_id, year?)`: devuelve `jsonb` agrupado por `categories.stat_key`, el total, las cimas distintas, los lugares distintos, los metros de desnivel y los km. Una categoría nueva aparece automáticamente.
* `get_shared_stats(friend_id, year?)`: las mismas métricas, contando solo los eventos en los que asistieron los dos.
* `friend_feed`: une eventos realizados, propuestas visibles y fotos de mis amigos, respetando la RLS.

---

## 3. Relaciones

```
auth.users 1─1 profiles
profiles   N─N profiles      friendships (par canónico a<b)
profiles   1─N plans         creator
plans      N─N profiles      plan_invitations (+ interés, rol)
plans      1─N events        events.plan_id opcional → los eventos pueden existir solos
events     N─N profiles      event_participants (+ rsvp, attended, rol)
events     N─N peaks         event_peaks (+ datos de la ascensión)
plans      N─N peaks         plan_peaks
events     1─N event_photos  N─1 profiles (uploader)
categories 1─N plans, events
profiles   1─N notifications (recipient)
```

Una propuesta puede dar lugar a **varios eventos** (repetir una salida). Esto prepara la *Bucket List*.

---

## 4. Estructura de carpetas

```
my-plans/
├─ messages/{es,en,ca}.json          # textos de la interfaz
├─ src/
│  ├─ app/[locale]/                   # segmento interno: la URL visible no lo lleva (§6.9)
│  │  ├─ (public)/login/
│  │  ├─ auth/callback/route.ts
│  │  ├─ onboarding/
│  │  └─ (app)/                       # shell con navegación (requiere sesión)
│  │     ├─ page.tsx                  # Inicio
│  │     ├─ agenda/
│  │     ├─ create/ · create/plan/ · create/event/
│  │     ├─ plans/ · plans/[id]/ · plans/[id]/schedule/
│  │     ├─ events/[id]/ · events/[id]/edit/ · events/[id]/complete/
│  │     ├─ friends/ · friends/requests/ · u/[username]/
│  │     ├─ history/ · history/with/[username]/
│  │     ├─ notifications/
│  │     └─ settings/
│  ├─ features/<dominio>/{components/, actions.ts, queries.ts, schemas.ts, types.ts}
│  │     dominios: profiles, friends, plans, events, agenda, history, photos, stats, notifications
│  ├─ components/{ui/ (shadcn), layout/, shared/}
│  ├─ i18n/                           # configuración de next-intl
│  ├─ lib/{supabase/, env.ts, action.ts, images.ts, dates.ts, utils.ts}
│  ├─ types/database.ts               # generado con `npm run db:types`
│  └─ proxy.ts
├─ supabase/{config.toml, migrations/, seed.sql, tests/}
├─ tests/{unit/, e2e/}
└─ docs/
```

---

## 5. Flujo de propuestas y eventos

```
PROPUESTA (open)
  │ creador invita a amigos      → plan_invitations(pending)      → 🔔 plan_invite
  │ invitados responden          → interested / not_interested    → 🔔 plan_interest
  ▼
"Organizar" (/plans/[id]/schedule)
  │ formulario prerrellenado (título, descripción, portada, ubicación, categoría, cimas)
  │ + fecha y hora (fin opcional)
  │ participantes: INTERESADOS preseleccionados; los pendientes y otros amigos, opcionales
  ▼
RPC convert_plan_to_event(...)       una sola transacción
  1. comprueba can_manage_plan(plan) y que la propuesta no esté borrada
  2. INSERT events (plan_id = propuesta)
  3. INSERT event_participants: creador = host/going; el resto = pending, source='plan'
  4. copia plan_peaks → event_peaks
  5. plans.status = 'scheduled'   (plan_invitations no se toca: el historial se conserva)
  → trigger 🔔 event_invite
  ▼
EVENTO (scheduled)
  │ RSVP going / not_going        → 🔔 event_rsvp al creador
  │ edición (fecha, hora, lugar)  → 🔔 event_updated a los participantes
  │ cancelar                      → 🔔 event_cancelled
  ▼
RPC complete_event(event, attendees[])   solo si starts_at ≤ now()
  status='completed', completed_at, attended = true para los asistentes reales
  si viene de una propuesta → plans.status = 'done'
  → 🔔 event_completed; las estadísticas y el historial se actualizan solos (vienen de la vista)
  ▼
GALERÍA: los asistentes suben fotos → 🔔 photos_added (agrupadas por subida)
```

Un evento creado directamente entra en la caja EVENTO con `plan_id = NULL`.

---

## 6. Seguridad

### 6.1 Funciones auxiliares de RLS

Son `SECURITY DEFINER`, `STABLE` y con `search_path = ''`, para evitar recursión entre políticas:

`are_friends(a, b)` · `can_view_plan(id)` · `can_manage_plan(id)` · `can_view_event(id)` ·
`can_manage_event(id)` · `is_event_participant(id)`

### 6.2 Políticas

| Tabla | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| profiles | Autenticados (solo datos no sensibles: nombre, username, avatar, bio; el email no está aquí) | Solo el propio perfil |
| friendships | Los dos implicados | Enviar con `requested_by = auth.uid()`; aceptar solo el destinatario (RPC); borrar cualquiera de los dos |
| plans | `can_view_plan` | El creador o un co-organizador (`can_manage_plan`); borrado lógico |
| plan_invitations | Quien puede ver la propuesta | Invitar con `can_manage_plan` **y solo a amigos**; responder solo el invitado (RPC) |
| events | `can_view_event` | `can_manage_event`; borrado lógico solo el creador |
| event_participants | Quien puede ver el evento | Invitar con `can_manage_event` + amigos; RSVP solo el propio usuario (RPC) |
| event_photos | Participantes | Subir: participantes `going`/`attended` después del inicio. Borrar: quien la subió o el organizador |
| notifications | El destinatario | Solo triggers. El destinatario solo marca `read_at` |

Las transiciones sensibles (aceptar una amistad, responder, convertir, completar) van por **RPC**, porque la RLS no restringe columnas. Las tablas solo conceden `UPDATE` sobre las columnas que el usuario puede editar.

### 6.3 Preparado para lo público

La visibilidad está centralizada en `can_view_plan` y `can_view_event`. Para añadir `public` basta con:
`ALTER TYPE visibility ADD VALUE 'public'` y una rama más en esas dos funciones (y en Storage).
No cambia ninguna tabla ni ninguna consulta de la app.

### 6.4 Preparado para co-organizadores

* `event_participants.role` y `plan_invitations.role` ya admiten `cohost`.
* **Todas** las comprobaciones de permisos usan `can_manage_*`, que ya acepta `host` y `cohost`.
* Activarlo será una RPC `set_member_role(...)`, que solo puede usar el creador, más la UI. No hace falta migrar datos.
* Borrar el evento o la propuesta queda siempre reservado al creador.

### 6.5 Storage

| Bucket | Acceso | Ruta |
|---|---|---|
| `avatars` | Lectura pública; escritura en la propia carpeta | `{user_id}/{uuid}.webp` |
| `covers` | Privado: `can_view_plan` / `can_view_event` | `plans/{plan_id}/…` · `events/{event_id}/…` |
| `event-photos` | Privado: participantes del evento | `{event_id}/{photo_id}.webp` · `{photo_id}_thumb.webp` |

* Tipos MIME permitidos: jpeg, png, webp, heic. Límite de 10 MB por archivo en el bucket.
* La compresión en el cliente deja las fotos en unos 2 MB.
* Signed URLs de 1 h, generadas en lote en el servidor.

### 6.6 Otros

* Zod en el servidor en todos los actions, más `CHECK` en la BD.
* Los errores internos nunca se muestran al usuario.
* Variables de entorno validadas al arrancar (`src/lib/env.ts`); `.env*.local` no se versiona.
* Las URLs externas se validan como `http(s)` y se abren con `rel="noopener noreferrer"`.
* Pruebas pgTAP para cada política crítica.
* E2E: en local se habilita email y contraseña **solo** para los usuarios del seed. En producción solo existe Google.

### 6.7 Notas de implementación (Fase 1)

* **Estado de la propuesta derivado:** `plans.status` no lo edita el usuario. Lo recalcula `refresh_plan_status()` a partir de sus eventos: con algún evento realizado pasa a `done`; con alguno programado, a `scheduled`; si no, `open`. Cancelar o borrar el evento devuelve la propuesta a `open`, sin perder nada.
* **Una sola RPC para eventos:** `create_event(..., p_plan_id)` crea un evento desde cero o convierte una propuesta. Si no se elige portada, reutiliza la de la propuesta.
* **IDs generados en la app** para `plans` y `event_photos`, así la portada o la foto se sube a su ruta definitiva en Storage.
* **Privilegios explícitos:** se han revocado los privilegios por defecto de Supabase. Cada tabla, vista o función nueva debe conceder los suyos (`20261107000200_security.sql`).
* **Helpers en el esquema `private`**, que la API no expone. Solo `authenticated` puede ejecutar los que usan las políticas.
* **Next 16 + Cache Components:** leer la sesión o el idioma es dinámico. El *shell* estático se prerenderiza y el contenido del usuario llega en streaming detrás de `<Suspense>` (se aplica en la Fase 2).
* **Claves de Supabase:** se usa la nueva *Publishable key* (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). La *Secret key* no se usa en la app.

### 6.9 Notas de implementación (Fase 2)

* **Idioma por reescritura:** `src/proxy.ts` elige el idioma (cookie `NEXT_LOCALE` → `Accept-Language`) y reescribe a `/[locale]/…` sin cambiar la URL. El layout raíz y `i18n/request.ts` lo leen con `next/root-params`, así que cada idioma tiene su *shell* prerenderizado. Las URLs con prefijo (`/ca/agenda`) redirigen a la versión sin prefijo. `/auth/*` no se reescribe (route handlers).
* **Shell estático + streaming:** la navegación y los títulos son estáticos. Todo lo que depende de la sesión, de `params`/`searchParams` o de la hora va dentro de `<Suspense>` con un *skeleton*. La hora se lee con `requestNow()` (`lib/dates.ts`), nunca con `Date.now()` en el render.
* **Datos de ejemplo:** las pantallas leen de `features/<dominio>/queries.ts`, que de momento devuelven `src/mocks/data.ts`. Cada fase sustituye esas funciones por consultas a Supabase sin tocar las páginas. Las acciones aún no conectadas usan `DemoButton`/`toast` y llevan un `TODO(Fase N)`.
* **Vista previa sin Supabase:** con `DESIGN_PREVIEW=1` en `.env.local` el proxy no exige sesión. Solo funciona con `next dev` (en producción no tiene efecto).
* **Diseño "Outdoor cálido":** tokens en `src/app/globals.css` (crema `#F7F3EC`, verde bosque `#2F5D46`, terracota `#C8643B`), con tema claro y oscuro (`next-themes`, clase `.dark`). Los colores de categoría usan los nombres de `categories.color` (`pine`, `granite`…). Tipografía: Fraunces (títulos) e Inter (texto). La terracota no llega a 4.5:1 sobre crema: para texto se usa `accent-strong`.
* **shadcn/ui** (estilo `radix-nova`) en `src/components/ui/`; botones e inputs ampliados a 40 px de alto para uso táctil.

### 6.10 Notas de implementación (Fase 3)

* **Sesión:** `features/profiles/queries.ts` es la capa de acceso. `getSessionProfile()` lee `getClaims()` y el perfil una sola vez por petición (`React.cache`). `getCurrentProfile()` además exige `username` y, si falta, redirige a `/onboarding`. El layout de `(app)` lo comprueba dentro de `<Suspense>`.
* **OAuth:** `signInWithGoogle` (Server Action) → Google → Supabase → `/auth/callback` (route handler fuera de `[locale]`). `next` pasa por `safeNextPath()`, que solo admite rutas internas. El callback copia `profiles.locale` a la cookie de idioma.
* **Refrescar tras escribir:** las lecturas no se cachean (dependen de la sesión), así que los actions llaman a `refresh()` de `next/cache` en lugar de `revalidatePath`.
* **Errores en formularios:** los esquemas Zod usan claves (`validation.<clave>`) como mensaje. `reportActionError()` (`lib/form.ts`) pinta los errores de campo o un toast con `errors.<código>`. Un `conflict` en `username` se muestra como "ya está cogido".
* **Avatares:** se comprimen en el navegador (`lib/images.ts`, 512 px WebP) y se suben con la sesión a `avatars/{id}/{uuid}.webp`. `setAvatar` guarda la URL pública y borra la foto anterior.
* **Tipos de la BD:** el job `database` de CI genera `database.generated.ts` (artefacto `database-types`) y falla si `src/types/database.ts` no coincide. La CLI está fijada a la misma versión que la devDependency.
* **Datos reales vs. de ejemplo:** perfil, amigos, solicitudes, búsqueda, estadísticas y el contador de notificaciones ya leen de Supabase. La lista de notificaciones sigue con `src/mocks` hasta su fase (desde la Fase 4, propuestas, eventos y agenda ya son reales; desde la Fase 5, también el historial). Con `DESIGN_PREVIEW=1` todo usa datos de ejemplo.

### 6.11 Notas de implementación (Fase 4)

* **Crear propuesta:** RPC `create_plan` (migración `20261108000100`). Inserta la propuesta y sus invitaciones en una transacción, `SECURITY INVOKER` para que la RLS siga siendo la guarda. Una propuesta privada no admite invitados: el esquema Zod los descarta y la RPC lo impide.
* **Crear evento / organizar propuesta:** un solo action `createEvent` sobre `create_event` (con `planId` si viene de una propuesta). Fecha y hora se introducen "de pared" y se convierten a instantes en la zona del evento (`features/events/dates.ts`). Una hora de fin anterior a la de inicio se entiende como del día siguiente. Los eventos de todo el día pueden durar varios días (último día a las 23:59).
* **Editar:** update directo con la RLS (columnas permitidas por `grant update`). Al editar solo se puede **invitar a más** amigos (`upsert … ignoreDuplicates`), no quitar invitados.
* **Respuestas:** interés con `set_plan_interest`. El RSVP es un update de mi fila o, si el evento es de visibilidad `friends` y no estaba invitado, un insert propio. Se pintan de forma optimista (`useOptimistic`).
* **Portadas:** la política de `covers` exige que la propuesta o el evento existan, así que el flujo es guardar → comprimir (1600 px WebP) → subir a `covers/{plans|events}/{id}/{uuid}.webp` → `setPlanCover`/`setEventCover`, que borra la anterior. Al leer se firman en lote (`lib/storage.ts`, 1 h).
* **Formularios:** React Hook Form con el esquema Zod de cliente (`eventFormSchema` valida sin transformar). El action recibe los valores crudos y vuelve a validar con el esquema de servidor (que sí transforma).
* **Pendiente para la Fase 5:** marcar como realizado (`complete_event`), historial y agenda con filtros. La página `/events/[id]/complete` sigue siendo de muestra. *(Hecho en la Fase 5, ver §6.12.)*

### 6.12 Notas de implementación (Fase 5)

* **Marcar como realizado:** action `completeEvent` sobre la RPC `complete_event`. `/events/[id]/complete` solo se abre para el organizador con el evento programado y ya empezado; si no, redirige al detalle (la RPC lo vuelve a comprobar). Vienen marcados el organizador y quien confirmó; hace falta al menos un asistente (`validation.attendeesRequired`). Los asistentes que no son participantes se ignoran.
* **Por cerrar:** la agenda muestra arriba los eventos que organizo, ya empezados y sin cerrar (`getEventsToComplete`).
* **Agenda:** usa la zona horaria del perfil. Filtro `?f=all|going|pending|hosting` (por mi respuesta; `hosting` = organizo) que se aplica al calendario y a la lista, y se conserva al cambiar de mes. Botón "Hoy" fuera del mes actual.
* **Historial:** lee de `completed_participations` (solo eventos realizados con `attended = true`). El compartido son los eventos en los que aparecen los dos usuarios. Filtros `?y=<año>` (también filtra las estadísticas: `p_year` de `get_user_stats`/`get_shared_stats`) y `?c=<categoría>`. El año es el de la zona de cada evento, igual que en `compute_stats`. La lógica de filtros es pura (`features/history/filters.ts`, `features/agenda/filters.ts`) y tiene pruebas unitarias.
* **`FilterTabs`** acepta `query` para conservar el resto de parámetros de la URL (`hrefWith`).
* **Sesión y Partial Prefetching:** `createClient()` (servidor) hace `await connection()` antes de leer las cookies, porque `getClaims()` compara la caducidad del JWT con `Date.now()` y con Partial Prefetching las cookies ya están disponibles en el prerender en tiempo de ejecución.
* **Pruebas pgTAP:** `04_history.test.sql` (cerrar, asistentes, historial compartido, año y visibilidad). Las pruebas solo tocan los perfiles `@test.dev`, así que pasan aunque la BD local tenga usuarios reales.
* **Pendiente:** paginación keyset del historial (hoy se cargan todos los eventos realizados); la galería y la subida de fotos son de la Fase 6.

### 6.13 Notas de implementación (Fase 6)

* **Subida de fotos:** solo en el navegador (`features/photos/upload.ts`). Cada archivo se decodifica una vez y se comprime a WebP: 2560 px (calidad 0,82) y miniatura de 480 px (0,75). Se sube a `event-photos/{event_id}/{photo_id}.webp` y `…_thumb.webp`, 3 en paralelo y como mucho 30 por subida. Después, `addPhotos` registra todas en **un solo INSERT**, así que el trigger manda una única `photos_added`. Si el INSERT falla, se borran los archivos. Los que no se pueden decodificar (p. ej. HEIC en un navegador sin soporte) se cuentan como fallidos y no bloquean el resto.
* **Permiso para subir:** `canAddPhotos` en `getEvent` replica `can_contribute_photos` (participante que va o asistió, evento empezado y no cancelado). La RLS de la tabla y la política del bucket lo vuelven a comprobar.
* **Galería:** `getEvent` firma en lote foto y miniatura (`signUrls`, 1 h, hasta 300 fotos). Visor con anterior/siguiente y flechas del teclado. `deletePhoto` borra la fila (RLS: quien la subió o el organizador) y después los dos archivos.
* **Cimas:** `PeakPicker` en propuestas y eventos de senderismo o cima. Busca en el catálogo compartido (`searchPeaks`, `ilike`) o crea una cima (`createPeak`; si choca con `UNIQUE (lower(name), altitude_m)`, devuelve la existente). `syncPeaks` deja `plan_peaks` / `event_peaks` igual que el formulario. Como `event_peaks` solo concede `UPDATE` en las columnas de la ascensión, se inserta con `ON CONFLICT DO NOTHING` y luego se actualizan desnivel y km cima a cima. Al cambiar a una categoría sin cimas, se quitan.
* **Datos de la ascensión:** desnivel (entero; acepta "1.450") y km (acepta coma) en el formulario del evento y al marcarlo como realizado. Son los que suman `elevation_gain_m` y `distance_km` en `compute_stats`.
* **Estadísticas:** `UserStats` incluye ascensiones, cima más alta y la fecha de la primera experiencia. El historial muestra las cimas conseguidas (respetando los filtros) y el perfil de un amigo muestra sus estadísticas propias, además de las compartidas.
* **Pruebas:** pgTAP `05_photos` y `06_peaks`, y unitarias de esquemas y agregados. Las políticas de Storage se comprobaron contra la BD local con usuarios temporales (subir, firmar, descargar y borrar; un no participante no puede).
* **Pendiente:** pies de foto (la columna `caption` ya existe), elegir una foto como portada y paginar la galería si un evento pasa de 300 fotos.

### 6.8 Pendiente de decidir

* **Borrado de cuenta:** hoy, borrar un usuario de `auth.users` borra en cascada sus propuestas y eventos. Antes de lanzarlo (Fase 7) conviene **anonimizar** en lugar de borrar, para no romper el historial de los amigos.

---

## 7. Plan de implementación

| Fase | Entregable |
|---|---|
| 1. Arquitectura | Repo y tooling, Supabase local, migraciones (esquema, RLS, RPC, triggers, storage), pruebas pgTAP, tipos generados, docs, CI. |
| 2. Diseño | Tokens, tipografía, AppShell (barra inferior en móvil y lateral en escritorio), componentes compartidos, páginas maquetadas, estados vacíos, i18n. |
| 3. Auth y amigos | Guía Supabase + Google, OAuth, onboarding, ajustes, cierre de sesión, búsqueda, solicitudes, perfil de amigo. |
| 4. Propuestas y eventos | CRUD, invitaciones, interés, RSVP, conversión, portadas. |
| 5. Agenda e historial | Calendario mensual, próximos eventos, filtros, marcar como realizado, historial personal y compartido. |
| 6. Fotos y estadísticas | Subida con compresión, galería, cimas, estadísticas individuales y compartidas. |
| 7. Notificaciones y acabado | Centro de notificaciones, contador en tiempo real, feed, E2E, revisión de seguridad, despliegue en Vercel. |

### Futuro (sin implementar, arquitectura preparada)

Grupos (`groups`, `group_members`, `visibility = 'group'`), Bucket List (propuestas `private` + varios eventos), mapas (`lat`, `lng`, `google_place_id` ya existen), estadísticas anuales (parámetro `year`), rankings e insignias (a partir de `completed_participations`), comentarios (`comments(entity_type, entity_id)`), chat (Realtime), compartir y lo público (§6.3), app móvil (la lógica está en la BD y las RPC son reutilizables), push (Database Webhooks → Edge Function) y calendarios externos (export ICS).
