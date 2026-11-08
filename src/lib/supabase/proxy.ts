import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

const PUBLIC_PATHS = ["/login", "/auth"];

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Solo en desarrollo: DESIGN_PREVIEW=1 permite ver las pantallas maquetadas sin
// Supabase (Fase 2). Nunca tiene efecto en un build de producción.
const DESIGN_PREVIEW = process.env.NODE_ENV === "development" && process.env.DESIGN_PREVIEW === "1";

// Refresca la sesión en cada petición y protege las rutas privadas.
// El onboarding (username) se comprueba en el layout de (app), no aquí, para no
// consultar la BD en cada petición.
// Con `rewriteUrl` la petición se sirve desde esa ruta interna (/[locale]/…).
export async function updateSession(request: NextRequest, rewriteUrl?: URL) {
  const next = () =>
    rewriteUrl ? NextResponse.rewrite(rewriteUrl, { request }) : NextResponse.next({ request });

  if (DESIGN_PREVIEW) return next();

  let response = next();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = next();
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getClaims() valida la firma del JWT; no fiarse de getSession() en el servidor.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
