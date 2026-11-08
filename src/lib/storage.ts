import "server-only";

import type { ServerSupabaseClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL = 60 * 60; // 1 h

type PrivateBucket = "covers" | "event-photos";

// Los buckets privados se firman en lote en el servidor (la política de
// Storage decide quién puede ver cada archivo).
export async function signUrls(
  supabase: ServerSupabaseClient,
  bucket: PrivateBucket,
  paths: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(unique, SIGNED_URL_TTL);
  if (error) {
    console.error("[storage] createSignedUrls", bucket, error);
    return new Map();
  }
  return new Map(
    data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])),
  );
}

export function signCoverUrls(
  supabase: ServerSupabaseClient,
  paths: (string | null | undefined)[],
) {
  return signUrls(supabase, "covers", paths);
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
