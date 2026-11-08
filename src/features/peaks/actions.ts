"use server";

import { getSessionProfile } from "@/features/profiles/queries";
import { createAction, unwrap } from "@/lib/action";
import { createClient } from "@/lib/supabase/server";

import { createPeakSchema, searchPeaksSchema, type Peak } from "./schemas";

const PEAK_COLUMNS = "id, name, altitude_m, range_name";

type PeakRow = { id: string; name: string; altitude_m: number; range_name: string | null };

const toPeak = (r: PeakRow): Peak => ({
  id: r.id,
  name: r.name,
  altitudeM: r.altitude_m,
  rangeName: r.range_name,
});

// Catálogo compartido de cimas (lo ve cualquier usuario con sesión).
export const searchPeaks = createAction(searchPeaksSchema, async ({ q }) => {
  const supabase = await createClient();
  // Los comodines de LIKE del texto se escapan para buscar literalmente.
  const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = unwrap(
    await supabase
      .from("peaks")
      .select(PEAK_COLUMNS)
      .ilike("name", pattern)
      .order("altitude_m", { ascending: false })
      .limit(8),
  );
  return rows.map(toPeak);
});

// Añade una cima al catálogo. Si ya existe (mismo nombre y altitud), devuelve esa.
export const createPeak = createAction(createPeakSchema, async ({ name, altitudeM }) => {
  const [supabase, profile] = await Promise.all([createClient(), getSessionProfile()]);
  const { data, error } = await supabase
    .from("peaks")
    .insert({ name, altitude_m: altitudeM, created_by: profile.id })
    .select(PEAK_COLUMNS)
    .single();
  if (!error && data) return toPeak(data);
  if (error?.code !== "23505") unwrap({ data: null, error });

  const existing = unwrap<PeakRow>(
    await supabase
      .from("peaks")
      .select(PEAK_COLUMNS)
      .ilike(
        "name",
        name.replace(/[\\%_]/g, (c) => `\\${c}`),
      )
      .eq("altitude_m", altitudeM)
      .limit(1)
      .single(),
  );
  return toPeak(existing);
});
