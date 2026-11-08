import "server-only";

import { unwrap } from "@/lib/action";
import type { ServerSupabaseClient } from "@/lib/supabase/server";

import type { Ascent } from "./schemas";

// Deja las cimas de una propuesta o un evento exactamente como `peaks`: quita
// las que sobran, añade las nuevas y, en eventos, guarda desnivel y km. La RLS
// (can_manage_plan / can_manage_event) es la guarda.
export async function syncPeaks(
  supabase: ServerSupabaseClient,
  target: { plan: string } | { event: string },
  peaks: Ascent[],
) {
  const ids = peaks.map((p) => p.id);
  const keep = `(${ids.join(",")})`;

  if ("plan" in target) {
    const remove = supabase.from("plan_peaks").delete().eq("plan_id", target.plan);
    unwrap(await (ids.length > 0 ? remove.not("peak_id", "in", keep) : remove));
    if (ids.length > 0) {
      unwrap(
        await supabase.from("plan_peaks").upsert(
          ids.map((peak_id) => ({ plan_id: target.plan, peak_id })),
          { onConflict: "plan_id,peak_id", ignoreDuplicates: true },
        ),
      );
    }
    return;
  }

  const remove = supabase.from("event_peaks").delete().eq("event_id", target.event);
  unwrap(await (ids.length > 0 ? remove.not("peak_id", "in", keep) : remove));
  if (ids.length === 0) return;
  unwrap(
    await supabase.from("event_peaks").upsert(
      ids.map((peak_id) => ({ event_id: target.event, peak_id })),
      { onConflict: "event_id,peak_id", ignoreDuplicates: true },
    ),
  );
  await saveAscents(supabase, target.event, peaks);
}

// Desnivel y km de cada cima del evento (solo columnas con grant update).
export async function saveAscents(
  supabase: ServerSupabaseClient,
  eventId: string,
  peaks: Ascent[],
) {
  await Promise.all(
    peaks.map(async (p) =>
      unwrap(
        await supabase
          .from("event_peaks")
          .update({ elevation_gain_m: p.elevationGainM, distance_km: p.distanceKm })
          .eq("event_id", eventId)
          .eq("peak_id", p.id),
      ),
    ),
  );
}
