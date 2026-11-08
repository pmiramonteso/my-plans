import "server-only";

import { unwrap } from "@/lib/action";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";
import { loadMocks } from "@/mocks/data";

import { toUserStats } from "./mappers";
import type { UserStats } from "./types";

// Las mías (sin usuario) o las de un amigo (la RPC exige amistad). Con `year`,
// solo las de ese año (en la zona de cada evento).
export async function getUserStats(userId?: string, year?: number | null): Promise<UserStats> {
  if (DESIGN_PREVIEW) return (await loadMocks()).stats;
  const supabase = await createClient();
  return toUserStats(
    unwrap(await supabase.rpc("get_user_stats", { p_user: userId, p_year: year ?? undefined })),
  );
}

export async function getMyStats(year?: number | null) {
  return getUserStats(undefined, year);
}

// Solo eventos a los que fuimos los dos.
export async function getSharedStats(
  friend: { id: string; username: string },
  year?: number | null,
): Promise<UserStats> {
  if (DESIGN_PREVIEW) {
    const { stats } = await loadMocks();
    return {
      ...stats,
      total: 7,
      byCategory: { hikes: 3, summits: 2, restaurants: 2 },
      elevationGainM: 2900,
      distanceKm: 41,
    };
  }
  const supabase = await createClient();
  return toUserStats(
    unwrap(
      await supabase.rpc("get_shared_stats", { p_friend: friend.id, p_year: year ?? undefined }),
    ),
  );
}
