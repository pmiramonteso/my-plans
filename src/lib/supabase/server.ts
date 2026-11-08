import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

// Cliente con la sesión del usuario: todas las consultas pasan por la RLS.
export async function createClient() {
  // auth-js compara la caducidad del JWT con Date.now(). Con Partial Prefetching
  // las cookies ya están disponibles en el prerender en tiempo de ejecución, así
  // que hay que esperar a la petición real antes de leer la hora.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Llamado desde un Server Component: el proxy ya refresca la sesión.
          }
        },
      },
    },
  );
}

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;
