import "server-only";

import { getCurrentProfile, getProfilesByIds, toProfileSummary } from "@/features/profiles/queries";
import { unwrap } from "@/lib/action";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";
import { loadMocks } from "@/mocks/data";
import type { Tables } from "@/types/database";

import type { Friend, FriendRequest, FriendshipState, SearchResult } from "./types";

type FriendshipRow = Pick<Tables<"friendships">, "user_a" | "user_b" | "requested_by" | "status">;

export function friendshipState(row: FriendshipRow | null, me: string): FriendshipState {
  if (!row) return "none";
  if (row.status === "accepted") return "friends";
  return row.requested_by === me ? "outgoing" : "incoming";
}

const otherOf = (row: Pick<FriendshipRow, "user_a" | "user_b">, me: string) =>
  row.user_a === me ? row.user_b : row.user_a;

// La RLS de friendships solo devuelve las filas en las que participo.
export async function getFriends(): Promise<Friend[]> {
  if (DESIGN_PREVIEW) return (await loadMocks()).friends;

  const [me, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const [rows, counts] = await Promise.all([
    supabase.from("friendships").select("user_a, user_b").eq("status", "accepted"),
    supabase.rpc("get_friends_shared_counts"),
  ]);
  const ids = unwrap(rows).map((r) => otherOf(r, me.id));
  const profiles = await getProfilesByIds(ids);
  const shared = new Map(unwrap(counts).map((c) => [c.friend_id, Number(c.shared_count)]));

  return ids
    .flatMap((id) => {
      const profile = profiles.get(id);
      return profile ? [{ ...profile, sharedCount: shared.get(id) ?? 0 }] : [];
    })
    .sort((a, b) => b.sharedCount - a.sharedCount || a.displayName.localeCompare(b.displayName));
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  if (DESIGN_PREVIEW) return (await loadMocks()).requests;

  const [me, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const rows = unwrap(
    await supabase
      .from("friendships")
      .select("user_a, user_b, requested_by, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  );
  const profiles = await getProfilesByIds(rows.map((r) => otherOf(r, me.id)));

  return rows.flatMap((r) => {
    const profile = profiles.get(otherOf(r, me.id));
    if (!profile) return [];
    return [
      {
        profile,
        direction: r.requested_by === me.id ? ("outgoing" as const) : ("incoming" as const),
        createdAt: r.created_at,
      },
    ];
  });
}

export async function getFriendshipWith(userId: string): Promise<FriendshipState> {
  if (DESIGN_PREVIEW) return "friends";

  const [me, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  if (userId === me.id) return "none";
  const { data } = await supabase
    .from("friendships")
    .select("user_a, user_b, requested_by, status")
    .eq("user_a", me.id < userId ? me.id : userId)
    .eq("user_b", me.id < userId ? userId : me.id)
    .maybeSingle();
  return friendshipState(data, me.id);
}

export async function searchProfiles(query: string): Promise<SearchResult[]> {
  if (query.trim().length < 2) return [];
  if (DESIGN_PREVIEW) {
    const q = query.toLowerCase();
    return (await loadMocks()).friends
      .filter((f) => f.username.includes(q) || f.displayName.toLowerCase().includes(q))
      .map((profile) => ({ profile, state: "friends" }));
  }

  const supabase = await createClient();
  const rows = unwrap(await supabase.rpc("search_profiles", { p_query: query, p_limit: 20 }));
  return rows.map((r) => {
    // `friendship` es null si no hay relación (left join).
    const status = r.friendship as FriendshipRow["status"] | null;
    const state: FriendshipState = !status
      ? "none"
      : status === "accepted"
        ? "friends"
        : r.requested_by_me
          ? "outgoing"
          : "incoming";
    return { profile: toProfileSummary(r), state };
  });
}
