import { resizeToWebp } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";

// Solo en el navegador: comprime la portada (1600 px, WebP) y la sube a
// covers/{plans|events}/{id}/{uuid}.webp. La política del bucket exige que la
// propuesta o el evento ya existan y que lo gestione el usuario.
export async function uploadCover(kind: "plans" | "events", id: string, file: File) {
  const blob = await resizeToWebp(file, { maxSize: 1600 });
  const path = `${kind}/${id}/${crypto.randomUUID()}.webp`;
  const { error } = await createClient()
    .storage.from("covers")
    .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw error;
  return path;
}

// Tras guardar: sube la portada elegida y la asocia. Devuelve false si falló
// (lo guardado se conserva; el usuario puede reintentar al editar).
export async function attachCover(
  kind: "plans" | "events",
  id: string,
  file: File,
  setCover: (input: { id: string; path: string }) => Promise<{ ok: boolean }>,
) {
  try {
    const path = await uploadCover(kind, id, file);
    return (await setCover({ id, path })).ok;
  } catch (error) {
    console.error("[cover]", error);
    return false;
  }
}
