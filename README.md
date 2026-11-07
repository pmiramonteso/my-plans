# my-plans

Plataforma social privada para proponer, organizar y recordar experiencias con amigos.

* Arquitectura, esquema de BD, seguridad y plan por fases: [`docs/architecture.md`](docs/architecture.md)
* Puesta en marcha local: [`docs/development.md`](docs/development.md)

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Postgres, Auth, Storage) · Zod · React Hook Form · next-intl (es/en/ca) · Vercel

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` · `npm run typecheck` · `npm test` | Calidad y pruebas unitarias |
| `npm run db:start` / `db:stop` | Arranca o para Supabase local (Docker) |
| `npm run db:reset` | Recrea la BD local desde las migraciones |
| `npm run db:test` | Pruebas pgTAP de RLS y flujos |
| `npm run db:types` | Regenera `src/types/database.ts` |
