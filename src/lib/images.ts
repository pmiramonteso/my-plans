// Compresión en el cliente antes de subir a Storage (WebP). No depende de la
// transformación de imágenes del plan Pro de Supabase.

export type ResizeOptions = {
  maxSize: number; // lado mayor en px
  square?: boolean; // recorte centrado (avatares)
  quality?: number;
};

export async function resizeToWebp(
  file: File,
  { maxSize, square = false, quality = 0.85 }: ResizeOptions,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const src = square
      ? { x: (bitmap.width - side) / 2, y: (bitmap.height - side) / 2, w: side, h: side }
      : { x: 0, y: 0, w: bitmap.width, h: bitmap.height };
    const scale = Math.min(1, maxSize / Math.max(src.w, src.h));
    const width = Math.round(src.w * scale);
    const height = Math.round(src.h * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas_unavailable");
    ctx.drawImage(bitmap, src.x, src.y, src.w, src.h, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("encode_failed"))),
        "image/webp",
        quality,
      ),
    );
  } finally {
    bitmap.close();
  }
}
