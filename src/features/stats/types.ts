// Forma de get_user_stats / get_shared_stats (jsonb).
export type StatKey =
  "hikes" | "summits" | "museums" | "restaurants" | "trips" | "cities" | "other";

export type UserStats = {
  total: number;
  byCategory: Partial<Record<StatKey, number>>;
  distinctPeaks: number;
  summitAscents: number; // ascensiones (una cima repetida cuenta varias veces)
  maxAltitudeM: number | null;
  distinctPlaces: number;
  elevationGainM: number;
  distanceKm: number;
  firstAt: string | null;
  lastAt: string | null;
};

// Una cima conseguida en los eventos del historial.
export type ClimbedPeak = {
  id: string;
  name: string;
  altitudeM: number;
  ascents: number;
  lastAt: string; // última vez (inicio del evento)
};
