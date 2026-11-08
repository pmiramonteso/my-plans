import "server-only";

import type { ServerSupabaseClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL = 60 * 60; // 1 h

// Las portadas están en un bucket privado: se firman en lote en el servidor
// (la política de Storage decide quién puede verlas).
export async function signCoverUrls(
  supabase: ServerSupabaseClient,
  paths: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from("covers")
    .createSignedUrls(unique, SIGNED_URL_TTL);
  if (error) {
    console.error("[storage] createSignedUrls", error);
    return new Map();
  }
  return new Map(
    data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])),
  );
}

// Borra una portada anterior si pertenece a la carpeta indicada. Si falla, solo
// queda un archivo huérfano.
export async function removeCover(
  supabase: ServerSupabaseClient,
  previous: string | null,
  folder: string,
  next: string,
) {
  if (previous && previous !== next && previous.startsWith(`${folder}/`)) {
    await supabase.storage.from("covers").remove([previous]);
  }
}
