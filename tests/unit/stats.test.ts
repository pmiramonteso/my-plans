import { describe, expect, it } from "vitest";

import { climbedPeaks } from "@/features/stats/climbs";
import { toUserStats } from "@/features/stats/mappers";

describe("toUserStats", () => {
  it("traduce el jsonb de compute_stats", () => {
    expect(
      toUserStats({
        total: 4,
        by_category: { hikes: 2, summits: 1, museums: 0, other: 1 },
        distinct_summits: 1,
        summit_ascents: 2,
        max_altitude_m: 3404,
        places: 3,
        elevation_gain_m: 1450,
        distance_km: 16.2,
        first_at: "2025-05-01T08:00:00+00:00",
        last_at: "2026-06-01T08:00:00+00:00",
      }),
    ).toEqual({
      total: 4,
      byCategory: { hikes: 2, summits: 1, museums: 0, other: 1 },
      distinctPeaks: 1,
      summitAscents: 2,
      maxAltitudeM: 3404,
      distinctPlaces: 3,
      elevationGainM: 1450,
      distanceKm: 16.2,
      firstAt: "2025-05-01T08:00:00+00:00",
      lastAt: "2026-06-01T08:00:00+00:00",
    });
  });

  it("tolera un resultado vacío", () => {
    expect(toUserStats(null)).toMatchObject({
      total: 0,
      byCategory: {},
      distanceKm: 0,
      maxAltitudeM: null,
      firstAt: null,
    });
  });
});

describe("climbedPeaks", () => {
  it("agrupa por cima, cuenta ascensiones y ordena por altitud", () => {
    expect(
      climbedPeaks([
        { peakId: "p", name: "Puigmal", altitudeM: 2910, startsAt: "2025-01-01T08:00:00Z" },
        { peakId: "a", name: "Aneto", altitudeM: 3404, startsAt: "2025-07-01T08:00:00Z" },
        { peakId: "p", name: "Puigmal", altitudeM: 2910, startsAt: "2026-02-01T08:00:00Z" },
      ]),
    ).toEqual([
      { id: "a", name: "Aneto", altitudeM: 3404, ascents: 1, lastAt: "2025-07-01T08:00:00Z" },
      { id: "p", name: "Puigmal", altitudeM: 2910, ascents: 2, lastAt: "2026-02-01T08:00:00Z" },
    ]);
  });
});
