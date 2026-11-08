import type { Json } from "@/types/database";

import type { StatKey, UserStats } from "./types";

// Forma de private.compute_stats (jsonb).
type RawStats = {
  total?: number;
  by_category?: Record<string, number>;
  distinct_summits?: number;
  summit_ascents?: number;
  max_altitude_m?: number | null;
  places?: number;
  elevation_gain_m?: number;
  distance_km?: number;
  first_at?: string | null;
  last_at?: string | null;
};

export function toUserStats(json: Json): UserStats {
  const raw = (json ?? {}) as RawStats;
  return {
    total: Number(raw.total ?? 0),
    byCategory: Object.fromEntries(
      Object.entries(raw.by_category ?? {}).map(([k, n]) => [k as StatKey, Number(n)]),
    ),
    distinctPeaks: Number(raw.distinct_summits ?? 0),
    summitAscents: Number(raw.summit_ascents ?? 0),
    maxAltitudeM: raw.max_altitude_m == null ? null : Number(raw.max_altitude_m),
    distinctPlaces: Number(raw.places ?? 0),
    elevationGainM: Number(raw.elevation_gain_m ?? 0),
    distanceKm: Number(raw.distance_km ?? 0),
    firstAt: raw.first_at ?? null,
    lastAt: raw.last_at ?? null,
  };
}
