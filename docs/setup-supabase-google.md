# Supabase y Google OAuth

Guía para dejar funcionando el inicio de sesión con Google, en local y en producción.
La app **solo** usa la *Publishable key*; la *Secret key* (antes `service_role`) nunca va en `.env`.

## 1. Credenciales de Google

1. Entra en <https://console.cloud.google.com> y crea un proyecto (por ejemplo, `my-plans`).
2. **APIs y servicios → Pantalla de consentimiento de OAuth**
   * Tipo de usuario: **Externo**.
   * Nombre de la app, email de asistencia y email del desarrollador.
   * Ámbitos: solo `openid`, `.../auth/userinfo.email` y `.../auth/userinfo.profile`.
   * Mientras la app esté en modo *Prueba*, añade como **usuarios de prueba** los emails de tus amigos.
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**
   * Tipo: **Aplicación web**.
   * **Orígenes de JavaScript autorizados**: `http://localhost:3000` y la URL de producción.
   * **URIs de redirección autorizados** (los de Supabase, no los de la app):
     * Local: `http://127.0.0.1:54321/auth/v1/callback`
     * Producción: `https://<ref-del-proyecto>.supabase.co/auth/v1/callback`
4. Guarda el **ID de cliente** y el **secreto del cliente**.

## 2. Supabase local (Docker)

1. Crea `supabase/.env` (no se versiona) con:

   ```bash
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<id de cliente>
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<secreto>
   ```

2. En `supabase/config.toml`, sección `[auth.external.google]`, cambia `enabled = false` por `enabled = true`
   **sin hacer commit** de ese cambio (en CI no hay credenciales).
3. `npm run db:stop && npm run db:start` y copia la URL y la *Publishable key* en `.env.local`
   (ver `docs/development.md`). Quita `DESIGN_PREVIEW` de `.env.local`.
4. `npm run dev` → <http://localhost:3000/login> → **Continuar con Google**.

## 3. Supabase Cloud (producción)

1. Crea el proyecto en <https://supabase.com/dashboard> (región `eu-west`, la más cercana a España).
2. Aplica las migraciones:

   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-del-proyecto>
   npx supabase db push
   ```

3. **Authentication → Sign In / Providers → Google**: actívalo y pega el ID y el secreto.
4. **Authentication → Sign In / Providers → Email**: **desactívalo**. En producción solo existe Google.
5. **Authentication → URL Configuration**
   * *Site URL*: la URL de producción (por ejemplo, `https://my-plans.vercel.app`).
   * *Redirect URLs*: `https://my-plans.vercel.app/auth/callback` (y la de las *preview deployments* de
     Vercel si las usas: `https://*-<tu-usuario>.vercel.app/auth/callback`).
6. **Project Settings → API Keys**: copia la *Publishable key* a las variables de entorno de Vercel
   junto con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SITE_URL`.

## Cómo funciona el flujo

```
/login  ──(Server Action signInWithGoogle)──▶  Google  ──▶  Supabase /auth/v1/callback
   ▲                                                              │
   │                                         /auth/callback?code=…&next=/ruta
   │                                                              │
   └── sin sesión, el proxy redirige aquí         exchangeCodeForSession (cookie de sesión)
                                                                  │
                                       sin username → /onboarding → /next
```

* El perfil se crea solo al registrarse (trigger `handle_new_user`) con el nombre y la foto de Google.
* Hasta elegir `username`, todas las pantallas de la app redirigen a `/onboarding`.
* `next` solo admite rutas internas (`/…`), para evitar redirecciones abiertas.
