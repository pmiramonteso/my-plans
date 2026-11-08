import { describe, expect, it } from "vitest";

import { hasPeaks } from "@/features/categories/config";
import { completeEventSchema } from "@/features/events/schemas";
import { createPeakSchema, MAX_PEAKS, peakSelectionSchema } from "@/features/peaks/schemas";

const A = "3f1c2b4a-8d6e-4f7a-9b2c-1d3e5f7a9b0c";
const B = "7a9e0c1d-2b3f-4a5c-8d6e-9f0a1b2c3d4e";

describe("cimas", () => {
  it("la selección del formulario queda en ids + ascensión, sin duplicados", () => {
    expect(
      peakSelectionSchema
        .parse([
          { id: A, name: "Aneto", altitudeM: 3404, elevationGainM: "1.450", distanceKm: "16,2" },
          { id: A, name: "Aneto", altitudeM: 3404 },
          { id: B, name: "Tuca", altitudeM: 3000, elevationGainM: "", distanceKm: "" },
        ])
        .map(({ id, elevationGainM, distanceKm }) => ({ id, elevationGainM, distanceKm })),
    ).toEqual([
      { id: A, elevationGainM: 1450, distanceKm: 16.2 },
      { id: B, elevationGainM: null, distanceKm: null },
    ]);
  });

  it("valida desnivel (entero, con separador de miles) y km (decimal con coma o punto)", () => {
    const one = (elevationGainM: string, distanceKm: string) =>
      peakSelectionSchema.safeParse([{ id: A, elevationGainM, distanceKm }]);
    expect(one("1 450", "16.2").data?.[0]).toMatchObject({
      elevationGainM: 1450,
      distanceKm: 16.2,
    });
    expect(one("1450,5", "").success).toBe(false);
    expect(one("-3", "").success).toBe(false);
    expect(one("", "1001").success).toBe(false);
    expect(one("abc", "").success).toBe(false);
  });

  it("como mucho MAX_PEAKS cimas", () => {
    const many = Array.from({ length: MAX_PEAKS + 1 }, () => ({ id: crypto.randomUUID() }));
    expect(peakSelectionSchema.safeParse(many).success).toBe(false);
  });

  it("crear una cima: nombre y altitud como en los CHECK", () => {
    expect(createPeakSchema.parse({ name: " Aneto ", altitudeM: "3404" })).toEqual({
      name: "Aneto",
      altitudeM: 3404,
    });
    expect(createPeakSchema.safeParse({ name: "X", altitudeM: 9500 }).success).toBe(false);
    expect(createPeakSchema.safeParse({ name: "", altitudeM: 100 }).success).toBe(false);
  });

  it("solo las categorías de montaña llevan cimas", () => {
    expect(hasPeaks("summit")).toBe(true);
    expect(hasPeaks("hiking")).toBe(true);
    expect(hasPeaks("museum")).toBe(false);
  });

  it("cerrar un evento acepta la ascensión", () => {
    const parsed = completeEventSchema.parse({
      id: A,
      attendees: [B],
      ascents: [{ id: A, elevationGainM: "900", distanceKm: "" }],
    });
    expect(parsed.ascents).toEqual([{ id: A, elevationGainM: 900, distanceKm: null }]);
  });
});
