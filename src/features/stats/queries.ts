import "server-only";

import { getHistory } from "@/features/history/queries";
import { loadMocks } from "@/mocks/data";

// TODO(Fase 6): RPC get_user_stats / get_shared_stats.

export async function getMyStats() {
  return (await loadMocks()).stats;
}

export async function getSharedStats(username: string) {
  const [{ stats }, shared] = await Promise.all([loadMocks(), getHistory(username)]);
  return {
    ...stats,
    total: shared.length,
    byCategory: { hikes: 3, summits: 2, restaurants: 2 },
    elevationGainM: 2900,
    distanceKm: 41,
  };
}
