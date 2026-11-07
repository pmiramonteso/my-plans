import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { isLocale, LOCALE_COOKIE, negotiateLocale } from "./config";

// Sin prefijo en la URL: los enlaces compartidos funcionan igual para amigos con
// distinto idioma. Orden: cookie (sincronizada con profiles.locale) → navegador.
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : negotiateLocale((await headers()).get("accept-language"));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
