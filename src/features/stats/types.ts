// Forma de get_user_stats / get_shared_stats (jsonb).
export type StatKey =
  "hikes" | "summits" | "museums" | "restaurants" | "trips" | "cities" | "other";

export type UserStats = {
  total: number;
  byCategory: Partial<Record<StatKey, number>>;
  distinctPeaks: number;
  distinctPlaces: number;
  elevationGainM: number;
  distanceKm: number;
};
