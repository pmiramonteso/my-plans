import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, securityHeaders } from "@/lib/security-headers";

const directive = (csp: string, name: string) =>
  csp
    .split("; ")
    .find((d) => d.startsWith(`${name} `))
    ?.split(" ")
    .slice(1);

describe("cabeceras de seguridad", () => {
  const prod = contentSecurityPolicy({ supabaseUrl: "https://abc.supabase.co/", dev: false });

  it("imágenes solo de la app, Supabase y los avatares de Google", () => {
    expect(directive(prod, "img-src")).toEqual([
      "'self'",
      "data:",
      "blob:",
      "https://abc.supabase.co",
      "https://*.googleusercontent.com",
    ]);
  });

  it("conexiones a Supabase, también Realtime por WebSocket seguro", () => {
    expect(directive(prod, "connect-src")).toEqual([
      "'self'",
      "https://abc.supabase.co",
      "wss://abc.supabase.co",
    ]);
  });

  it("no se puede incrustar en otra web ni cargar plugins", () => {
    expect(directive(prod, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(prod, "object-src")).toEqual(["'none'"]);
  });

  it("'unsafe-eval' solo en desarrollo; HSTS solo en producción", () => {
    expect(directive(prod, "script-src")).not.toContain("'unsafe-eval'");
    const dev = contentSecurityPolicy({ supabaseUrl: "http://127.0.0.1:54321", dev: true });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "connect-src")).toContain("ws://127.0.0.1:54321");

    const keys = (dev: boolean) =>
      securityHeaders({ supabaseUrl: "https://abc.supabase.co", dev }).map((h) => h.key);
    expect(keys(false)).toContain("Strict-Transport-Security");
    expect(keys(true)).not.toContain("Strict-Transport-Security");
  });
});

describe("upgrade-insecure-requests", () => {
  it("solo en producción con Supabase en HTTPS", () => {
    expect(contentSecurityPolicy({ supabaseUrl: "https://abc.supabase.co", dev: false })).toContain(
      "upgrade-insecure-requests",
    );
    expect(
      contentSecurityPolicy({ supabaseUrl: "http://127.0.0.1:54321", dev: false }),
    ).not.toContain("upgrade-insecure-requests");
  });
});
