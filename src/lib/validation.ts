import { z } from "zod";

// Campos reutilizables. Los mensajes son claves de messages/*.json → validation.*

export const requiredText = (max: number) =>
  z.string().trim().min(1, "required").max(max, "tooLong");

// "" → null (columna vacía en la BD).
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .transform((v) => v || null);

// Solo http(s), igual que el CHECK de la BD (evita javascript: y similares).
export const optionalUrl = z
  .string()
  .trim()
  .max(2000, "tooLong")
  .refine((v) => !v || /^https?:\/\/[^\s]+$/i.test(v), "url")
  .transform((v) => v || null);

// Un grupo de checkboxes de React Hook Form da string[], un único checkbox da
// string o false: se normaliza siempre a lista sin duplicados.
export const uuidList = z.preprocess(
  (v) => (Array.isArray(v) ? v : typeof v === "string" ? [v] : []),
  z
    .array(z.uuid())
    .max(100)
    .transform((ids) => [...new Set(ids)]),
);
