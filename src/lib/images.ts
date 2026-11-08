// Compresión en el cliente antes de subir a Storage (WebP). No depende de la
// transformación de imágenes del plan Pro de Supabase.

export type ResizeOptions = {
  maxSize: number; // lado mayor en px
  square?: boolean; // recorte centrado (avatares)
  quality?: number;
};

export type ResizedImage = { blob: Blob; width: number; height: number };

export async function resizeToWebp(file: Blob, options: ResizeOptions): Promise<Blob> {
  return (await resizeImage(file, options)).blob;
}

// Igual que resizeToWebp, pero devuelve también las dimensiones finales.
// Con varios tamaños (foto + miniatura) se decodifica el archivo una sola vez.
export async function resizeImage(file: Blob, options: ResizeOptions): Promise<ResizedImage> {
  return (await resizeImageSizes(file, [options]))[0];
}

export async function resizeImageSizes(
  file: Blob,
  sizes: ResizeOptions[],
): Promise<ResizedImage[]> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const results: ResizedImage[] = [];
    for (const options of sizes) results.push(await draw(bitmap, options));
    return results;
  } finally {
    bitmap.close();
  }
}

async function draw(
  bitmap: ImageBitmap,
  { maxSize, square = false, quality = 0.85 }: ResizeOptions,
): Promise<ResizedImage> {
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

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("encode_failed"))),
      "image/webp",
      quality,
    ),
  );
  return { blob, width, height };
}
