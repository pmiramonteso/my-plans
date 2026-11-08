import { z } from "zod";

import { requiredText } from "@/lib/validation";

export type Peak = { id: string; name: string; altitudeM: number; rangeName: string | null };

// Cima elegida en un formulario. Desnivel y km son de la ascensión (solo en
// eventos) y vienen de inputs: texto, "" = sin dato.
export type PeakSelection = {
  id: string;
  name: string;
  altitudeM: number;
  elevationGainM?: string;
  distanceKm?: string;
};

export const MAX_PEAKS = 10;

// Igual que los CHECK de public.peaks.
export const createPeakSchema = z.object({
  name: requiredText(120),
  altitudeM: z.coerce.number("required").int("invalid").min(0, "invalid").max(9000, "invalid"),
});

export const searchPeaksSchema = z.object({ q: z.string().trim().min(2).max(60) });

// "" o nada → null. Enteros: "1.450" o "1 450" → 1450 (separador de miles).
// Decimales: "16,2" → 16.2. Igual que los CHECK de event_peaks.
const optionalMeasure = (max: number, integer: boolean) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((value, ctx) => {
      const text =
        typeof value === "string"
          ? integer
            ? value.replace(/[\s.]/g, "")
            : value.trim().replace(",", ".")
          : value;
      if (text === undefined || text === "") return null;
      const n = Number(text);
      if (!Number.isFinite(n) || n < 0 || n > max || (integer && !Number.isInteger(n))) {
        ctx.addIssue({ code: "custom", message: "invalid" });
        return z.NEVER;
      }
      return n;
    });

export const ascentSchema = z.object({
  id: z.uuid(),
  elevationGainM: optionalMeasure(10000, true),
  distanceKm: optionalMeasure(1000, false),
});

// Lista de cimas de un formulario → [{ id, elevationGainM, distanceKm }] sin duplicados.
export const peakSelectionSchema = z
  .array(ascentSchema.loose())
  .max(MAX_PEAKS, "tooMany")
  .default([])
  .transform((peaks) => peaks.filter((p, i) => peaks.findIndex((q) => q.id === p.id) === i));

export type Ascent = z.output<typeof ascentSchema>;
