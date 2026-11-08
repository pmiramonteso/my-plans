import "server-only";

import { getHistory } from "@/features/history/queries";
import { unwrap } from "@/lib/action";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";
import { loadMocks } from "@/mocks/data";

import { toUserStats } from "./mappers";
import type { UserStats } from "./types";

// Las mías (sin argumento) o las de un amigo (la RPC exige amistad).
export async function getUserStats(userId?: string): Promise<UserStats> {
  if (DESIGN_PREVIEW) return (await loadMocks()).stats;
  const supabase = await createClient();
  return toUserStats(unwrap(await supabase.rpc("get_user_stats", { p_user: userId })));
}

export async function getMyStats() {
  return getUserStats();
}

// Solo eventos a los que fuimos los dos.
export async function getSharedStats(friend: { id: string; username: string }): Promise<UserStats> {
  if (DESIGN_PREVIEW) {
    const [{ stats }, shared] = await Promise.all([loadMocks(), getHistory(friend.username)]);
    return {
      ...stats,
      total: shared.length,
      byCategory: { hikes: 3, summits: 2, restaurants: 2 },
      elevationGainM: 2900,
      distanceKm: 41,
    };
  }
  const supabase = await createClient();
  return toUserStats(unwrap(await supabase.rpc("get_shared_stats", { p_friend: friend.id })));
}
