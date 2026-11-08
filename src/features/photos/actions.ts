"use server";

import { refresh } from "next/cache";

import { getSessionProfile } from "@/features/profiles/queries";
import { AppError, createAction, unwrap } from "@/lib/action";
import { createClient } from "@/lib/supabase/server";

import { addPhotosSchema, photoIdSchema, photoPaths } from "./schemas";

// Registra las fotos ya subidas a event-photos. Un solo INSERT: el trigger
// manda una única notificación photos_added por subida. La RLS exige que pueda
// aportar fotos (participante que va o asistió, evento empezado).
export const addPhotos = createAction(addPhotosSchema, async ({ eventId, photos }) => {
  const [supabase, profile] = await Promise.all([createClient(), getSessionProfile()]);
  const rows = photos.map((p) => ({
    id: p.id,
    event_id: eventId,
    uploader_id: profile.id,
    ...pathColumns(eventId, p.id),
    width: p.width,
    height: p.height,
    size_bytes: p.sizeBytes,
  }));

  const { error } = await supabase.from("event_photos").insert(rows);
  if (error) {
    // Sin fila no hay foto: no dejar archivos huérfanos.
    await supabase.storage
      .from("event-photos")
      .remove(rows.flatMap((r) => [r.storage_path, r.thumb_path]));
    unwrap({ data: null, error });
  }
  refresh();
  return { count: rows.length };
});

// Borrado físico (fila + archivos), por privacidad. Puede quien la subió o el
// organizador (RLS de la tabla y del bucket).
export const deletePhoto = createAction(photoIdSchema, async ({ id }) => {
  const supabase = await createClient();
  const deleted = unwrap(
    await supabase.from("event_photos").delete().eq("id", id).select("storage_path, thumb_path"),
  );
  const row = deleted[0];
  if (!row) throw new AppError("forbidden");

  const { error } = await supabase.storage
    .from("event-photos")
    .remove([row.storage_path, row.thumb_path]);
  if (error) console.error("[photos] remove", error); // queda un archivo huérfano
  refresh();
});

function pathColumns(eventId: string, photoId: string) {
  const { storagePath, thumbPath } = photoPaths(eventId, photoId);
  return { storage_path: storagePath, thumb_path: thumbPath };
}
