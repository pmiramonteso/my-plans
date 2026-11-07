import { NextResponse, type NextRequest } from "next/server";

import { isLocale, LOCALE_COOKIE, LOCALES, negotiateLocale } from "@/i18n/config";
import { updateSession } from "@/lib/supabase/proxy";

// Rutas que no pasan por /[locale] (route handlers sin layout).
const NON_LOCALIZED_PATHS = ["/auth"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Las URLs nunca llevan el idioma: /ca/agenda → /agenda.
  const prefix = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (prefix) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(prefix.length + 1) || "/";
    url.search = search;
    return NextResponse.redirect(url);
  }

  if (NON_LOCALIZED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return updateSession(request);
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : negotiateLocale(request.headers.get("accept-language"));

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return updateSession(request, rewriteUrl);
}

export const config = {
  matcher: [
    // Todo excepto estáticos e imágenes.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
