import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/features/auth/redirect";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

// Vuelta de Google (vía Supabase): canjea el código por la sesión (cookies) y
// sincroniza la cookie de idioma con la preferencia guardada en el perfil.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(new URL(next, origin));
      const { data: profile } = await supabase
        .from("profiles")
        .select("locale")
        .eq("id", data.user.id)
        .single();
      if (isLocale(profile?.locale)) {
        response.cookies.set(LOCALE_COOKIE, profile.locale, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        });
      }
      return response;
    }
    console.error("[auth] exchangeCodeForSession", error);
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
