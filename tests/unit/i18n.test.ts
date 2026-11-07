import { describe, expect, it } from "vitest";

import ca from "../../messages/ca.json";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import { APP_ERROR_CODES } from "@/lib/action";
import { negotiateLocale } from "@/i18n/config";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("mensajes", () => {
  it("los tres idiomas tienen las mismas claves", () => {
    const reference = keys(es).sort();
    expect(keys(en).sort()).toEqual(reference);
    expect(keys(ca).sort()).toEqual(reference);
  });

  it("cada código de error tiene traducción", () => {
    for (const code of APP_ERROR_CODES) expect(es.errors).toHaveProperty(code);
  });
});

describe("negotiateLocale", () => {
  it("usa el idioma preferido soportado", () => {
    expect(negotiateLocale("ca-ES,ca;q=0.9,es;q=0.8")).toBe("ca");
    expect(negotiateLocale("fr-FR,fr;q=0.9,en;q=0.8")).toBe("en");
    expect(negotiateLocale("de;q=0.2,es;q=0.5,en;q=0.4")).toBe("es");
  });

  it("vuelve al español por defecto", () => {
    expect(negotiateLocale(null)).toBe("es");
    expect(negotiateLocale("de-DE")).toBe("es");
  });
});
