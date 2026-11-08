// Solo en desarrollo: DESIGN_PREVIEW=1 permite ver las pantallas sin Supabase
// (sesión y lecturas con datos de ejemplo). Nunca tiene efecto en producción.
export const DESIGN_PREVIEW =
  process.env.NODE_ENV === "development" && process.env.DESIGN_PREVIEW === "1";
