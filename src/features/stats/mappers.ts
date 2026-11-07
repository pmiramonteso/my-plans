import type { Json } from "@/types/database";

import type { StatKey, UserStats } from "./types";

// Forma de private.compute_stats (jsonb).
type RawStats = {
  total?: number;
  by_category?: Record<string, number>;
  distinct_summits?: number;
  places?: number;
  elevation_gain_m?: number;
  distance_km?: number;
};

export function toUserStats(json: Json): UserStats {
  const raw = (json ?? {}) as RawStats;
  return {
    total: Number(raw.total ?? 0),
    byCategory: Object.fromEntries(
      Object.entries(raw.by_category ?? {}).map(([k, n]) => [k as StatKey, Number(n)]),
    ),
    distinctPeaks: Number(raw.distinct_summits ?? 0),
    distinctPlaces: Number(raw.places ?? 0),
    elevationGainM: Number(raw.elevation_gain_m ?? 0),
    distanceKm: Number(raw.distance_km ?? 0),
  };
}
