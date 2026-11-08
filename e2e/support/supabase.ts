import { execSync } from "node:child_process";

export type LocalSupabase = { url: string; publishableKey: string; secretKey: string };

let cached: LocalSupabase | undefined;

// Claves del Supabase local (`supabase status`). La secret key solo se usa en
// las pruebas, para crear y borrar los usuarios de prueba.
export function localSupabase(): LocalSupabase {
  if (cached) return cached;
  const out = execSync("npx supabase status -o json", { encoding: "utf8", stdio: "pipe" });
  const status = JSON.parse(out.slice(out.indexOf("{"))) as Record<string, string>;
  cached = {
    url: status.API_URL,
    publishableKey: status.PUBLISHABLE_KEY,
    secretKey: status.SECRET_KEY,
  };
  return cached;
}
