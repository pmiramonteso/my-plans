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

## Flujo de trabajo con la base de datos

* Cada cambio de esquema es una **migración nueva** en `supabase/migrations/`. Nunca se edita una migración ya desplegada.
* Después de cambiar el esquema: `npm run db:reset && npm run db:types && npm run db:test`.
* Toda tabla, vista o función nueva concede sus privilegios explícitamente (ver `docs/architecture.md` §6.7) y lleva sus pruebas en `supabase/tests/database/`.
