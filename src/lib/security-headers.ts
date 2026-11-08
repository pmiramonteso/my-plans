// Cabeceras de seguridad de todas las respuestas (next.config.ts).
//
// La CSP limita de dónde se cargan imágenes y a dónde se conecta la app:
// - img-src: la app, Supabase (avatares, portadas y fotos firmadas) y los
//   avatares de Google. Así un avatar_url externo no sirve de píxel espía.
// - connect-src: Supabase (API, Storage y Realtime por WebSocket).
// - form-action: el login con Google redirige a Supabase y a Google.
// Los scripts necesitan 'unsafe-inline' (Next inyecta scripts en línea sin
// nonce con el shell prerenderizado) y, solo en desarrollo, 'unsafe-eval'.

type Options = { supabaseUrl: string; dev: boolean };

export function contentSecurityPolicy({ supabaseUrl, dev }: Options) {
  const supabase = new URL(supabaseUrl).origin;
  const realtime = supabase.replace(/^http/, "ws");
  const googleAvatars = "https://*.googleusercontent.com";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", supabase, googleAvatars],
    "font-src": ["'self'"],
    "connect-src": ["'self'", supabase, realtime],
    "form-action": ["'self'", supabase, "https://accounts.google.com"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "worker-src": ["'self'", "blob:"],
  };
  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
  return dev ? policy : `${policy}; upgrade-insecure-requests`;
}

export function securityHeaders(options: Options) {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    ...(options.dev
      ? []
      : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
  ];
}
