import { resizeImageSizes } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";

import {
  MAX_PHOTO_BYTES,
  PHOTO_MAX_SIZE,
  photoPaths,
  THUMB_MAX_SIZE,
  type UploadedPhoto,
} from "./schemas";

const CONCURRENCY = 3;

// Solo en el navegador: comprime cada foto (2560 px + miniatura de 480 px, WebP)
// y las sube a event-photos/{event_id}/… Devuelve las que se subieron bien; las
// que fallan (formato no soportado, red…) se cuentan aparte.
export async function uploadEventPhotos(
  eventId: string,
  files: File[],
  onProgress: (done: number) => void,
): Promise<{ uploaded: UploadedPhoto[]; failed: number }> {
  const storage = createClient().storage.from("event-photos");
  const uploaded: UploadedPhoto[] = [];
  let failed = 0;
  let done = 0;
  let next = 0;

  async function uploadOne(file: File) {
    const id = crypto.randomUUID();
    const [full, thumb] = await resizeImageSizes(file, [
      { maxSize: PHOTO_MAX_SIZE, quality: 0.82 },
      { maxSize: THUMB_MAX_SIZE, quality: 0.75 },
    ]);
    if (full.blob.size > MAX_PHOTO_BYTES) throw new Error("too_large");

    const { storagePath, thumbPath } = photoPaths(eventId, id);
    const options = { contentType: "image/webp", cacheControl: "31536000" };
    const results = await Promise.all([
      storage.upload(storagePath, full.blob, options),
      storage.upload(thumbPath, thumb.blob, options),
    ]);
    const error = results.find((r) => r.error)?.error;
    if (error) {
      await storage.remove([storagePath, thumbPath]);
      throw error;
    }
    return { id, width: full.width, height: full.height, sizeBytes: full.blob.size };
  }

  async function worker() {
    while (next < files.length) {
      const file = files[next++];
      try {
        uploaded.push(await uploadOne(file));
      } catch (error) {
        console.error("[photos] upload", file.name, error);
        failed++;
      }
      onProgress(++done);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker));
  return { uploaded, failed };
}
