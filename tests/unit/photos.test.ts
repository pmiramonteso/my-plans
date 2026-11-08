import { describe, expect, it } from "vitest";

import { addPhotosSchema, MAX_PHOTOS_PER_UPLOAD, photoPaths } from "@/features/photos/schemas";

const EVENT = "3f1c2b4a-8d6e-4f7a-9b2c-1d3e5f7a9b0c";
const PHOTO = "7a9e0c1d-2b3f-4a5c-8d6e-9f0a1b2c3d4e";
const photo = { id: PHOTO, width: 2560, height: 1920, sizeBytes: 1_500_000 };

describe("fotos", () => {
  it("las rutas empiezan por el evento (lo exige la política del bucket)", () => {
    expect(photoPaths(EVENT, PHOTO)).toEqual({
      storagePath: `${EVENT}/${PHOTO}.webp`,
      thumbPath: `${EVENT}/${PHOTO}_thumb.webp`,
    });
  });

  it("valida la subida", () => {
    expect(addPhotosSchema.safeParse({ eventId: EVENT, photos: [photo] }).success).toBe(true);
    expect(addPhotosSchema.safeParse({ eventId: EVENT, photos: [] }).success).toBe(false);
    expect(
      addPhotosSchema.safeParse({
        eventId: EVENT,
        photos: Array.from({ length: MAX_PHOTOS_PER_UPLOAD + 1 }, () => photo),
      }).success,
    ).toBe(false);
    // Más grande que la compresión o que el límite del bucket.
    expect(
      addPhotosSchema.safeParse({ eventId: EVENT, photos: [{ ...photo, width: 4000 }] }).success,
    ).toBe(false);
    expect(
      addPhotosSchema.safeParse({ eventId: EVENT, photos: [{ ...photo, sizeBytes: 11e6 }] })
        .success,
    ).toBe(false);
  });
});
