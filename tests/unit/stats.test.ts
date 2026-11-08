import { describe, expect, it } from "vitest";

import { toUserStats } from "@/features/stats/mappers";

describe("toUserStats", () => {
  it("traduce el jsonb de compute_stats", () => {
    expect(
      toUserStats({
        total: 4,
        by_category: { hikes: 2, summits: 1, museums: 0, other: 1 },
        distinct_summits: 1,
        summit_ascents: 2,
        places: 3,
        elevation_gain_m: 1450,
        distance_km: 16.2,
      }),
    ).toEqual({
      total: 4,
      byCategory: { hikes: 2, summits: 1, museums: 0, other: 1 },
      distinctPeaks: 1,
      distinctPlaces: 3,
      elevationGainM: 1450,
      distanceKm: 16.2,
    });
  });

  it("tolera un resultado vacío", () => {
    expect(toUserStats(null)).toMatchObject({ total: 0, byCategory: {}, distanceKm: 0 });
  });
});
