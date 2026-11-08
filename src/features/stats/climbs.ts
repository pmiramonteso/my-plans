import type { ClimbedPeak } from "./types";

export type Ascent = { peakId: string; name: string; altitudeM: number; startsAt: string };

// Una fila por cima: nº de ascensiones y la última. De la más alta a la más baja.
export function climbedPeaks(ascents: Ascent[]): ClimbedPeak[] {
  const byPeak = new Map<string, ClimbedPeak>();
  for (const a of ascents) {
    const current = byPeak.get(a.peakId);
    if (current) {
      current.ascents++;
      if (a.startsAt > current.lastAt) current.lastAt = a.startsAt;
    } else {
      byPeak.set(a.peakId, {
        id: a.peakId,
        name: a.name,
        altitudeM: a.altitudeM,
        ascents: 1,
        lastAt: a.startsAt,
      });
    }
  }
  return [...byPeak.values()].sort(
    (x, y) => y.altitudeM - x.altitudeM || x.name.localeCompare(y.name),
  );
}
