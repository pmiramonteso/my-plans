import { z } from "zod";

// Fotos: 2560 px (≈2 MB en WebP) + miniatura de 480 px. Por subida, como mucho
// MAX_PHOTOS_PER_UPLOAD (una sola notificación photos_added por subida).
export const PHOTO_MAX_SIZE = 2560;
export const THUMB_MAX_SIZE = 480;
export const MAX_PHOTOS_PER_UPLOAD = 30;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // límite del bucket

// Rutas en event-photos: la política del bucket lee el event_id de la primera
// carpeta. Las genera siempre la app a partir de los ids.
export function photoPaths(eventId: string, photoId: string) {
  return {
    storagePath: `${eventId}/${photoId}.webp`,
    thumbPath: `${eventId}/${photoId}_thumb.webp`,
  };
}

const dimension = z.number().int().min(1).max(PHOTO_MAX_SIZE);

export const addPhotosSchema = z.object({
  eventId: z.uuid(),
  photos: z
    .array(
      z.object({
        id: z.uuid(),
        width: dimension,
        height: dimension,
        sizeBytes: z.number().int().min(1).max(MAX_PHOTO_BYTES),
      }),
    )
    .min(1)
    .max(MAX_PHOTOS_PER_UPLOAD),
});

export const photoIdSchema = z.object({ id: z.uuid() });

export type UploadedPhoto = z.infer<typeof addPhotosSchema>["photos"][number];
