export { cn } from "cn";

// "noviembre de 2026" → "Noviembre de 2026" (CSS `capitalize` afecta a cada palabra).
export const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);
