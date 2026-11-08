// Ruta interna a la que volver tras el login. Solo se aceptan rutas relativas
// del propio sitio ("/agenda?m=…"), nunca "//otro.com" ni URLs absolutas.
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (/[\u0000-\u001f]/.test(value)) return "/";
  return value;
}
