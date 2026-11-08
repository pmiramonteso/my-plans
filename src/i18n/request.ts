import { locale as rootLocale } from "next/root-params";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, isLocale } from "./config";

// El proxy reescribe cada URL a /[locale]/… sin cambiar la que ve el usuario
// (los enlaces compartidos funcionan igual para amigos con distinto idioma).
// Leer el locale del segmento, y no de la cookie, permite prerenderizar el shell
// estático de cada idioma con Cache Components.
// Los Server Actions no tienen root params: devuelven códigos de error y los
// traduce el cliente, así que no necesitan mensajes en el servidor.
export default getRequestConfig(async ({ locale: override }) => {
  const requested = override ?? (await rootLocale());
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  return {
    locale,
    // TODO(Fase 3): zona horaria del perfil. Cada evento guarda la suya propia.
    timeZone: "Europe/Madrid",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
