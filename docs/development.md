# Desarrollo local

## Requisitos

* Node.js 24 o superior
* **Docker Desktop**, que la Supabase CLI necesita para levantar Postgres, Auth y Storage en local
  * Windows: <https://docs.docker.com/desktop/setup/install/windows-install/>. Activa el backend **WSL 2** durante la instalación y reinicia el equipo si te lo pide.
  * Abre Docker Desktop y espera a que indique *Engine running*.

## Primera vez

```bash
npm install
npm run db:start          # la primera vez descarga las imágenes (unos minutos)
```

`db:start` muestra la **API URL** y la **Publishable key**. Cópialas en `.env.local`:

```bash
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

```bash
npm run db:types          # tipos de TypeScript desde la BD
npm run db:test           # pruebas pgTAP (RLS y flujos)
npm run dev               # http://localhost:3000
```

Supabase Studio, la interfaz para explorar la BD local, está en <http://127.0.0.1:54323>.

## Ver el diseño sin Supabase

Para revisar las pantallas maquetadas (datos de ejemplo de `src/mocks/data.ts`) sin Docker:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=design-preview
DESIGN_PREVIEW=1
```

`npm run dev` y abre <http://localhost:3000>. `DESIGN_PREVIEW` solo tiene efecto en desarrollo.

Para iniciar sesión de verdad (Google) sigue `docs/setup-supabase-google.md`.

## Flujo de trabajo con la base de datos

* Cada cambio de esquema es una **migración nueva** en `supabase/migrations/`. Nunca se edita una migración ya desplegada.
* Después de cambiar el esquema: `npm run db:reset && npm run db:types && npm run db:test`.
* Sin Docker: el CI genera los tipos en el artefacto `database-types` del job `database`
  (`gh run download <id> -n database-types`) y comprueba que `src/types/database.ts` está al día.
* Toda tabla, vista o función nueva concede sus privilegios explícitamente (ver `docs/architecture.md` §6.7) y lleva sus pruebas en `supabase/tests/database/`.

## Pruebas E2E (Playwright)

Simulan a varias personas usando la app en Chromium: login, propuesta, interés, organizar, confirmar, cerrar el evento e historial compartido.

```bash
npm run db:start                  # Supabase local
npx playwright install chromium   # la primera vez
npm run test:e2e
```

* Se ejecutan contra la **versión de producción** (`next build` + `next start` en el puerto 3100), así que no chocan con `npm run dev`. Si ya hay algo escuchando en el 3100, lo reutilizan.
* Las claves salen de `supabase status`. Cada prueba crea sus usuarios con **email y contraseña** (con la *secret key* local) y los borra al terminar. La app no tiene login por contraseña: las pruebas escriben directamente las cookies de sesión de `@supabase/ssr`. En producción el único acceso es Google.
* En el CI hay un *job* `e2e`. Si falla, el informe se sube como artefacto `playwright-report`.
