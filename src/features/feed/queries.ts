import "server-only";

import { categoryFromId, type CategorySlug } from "@/features/categories/config";
import { getProfilesByIds } from "@/features/profiles/queries";
import type { ProfileSummary } from "@/features/profiles/types";
import { unwrap } from "@/lib/action";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { signCoverUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { loadMocks } from "@/mocks/data";

export type FeedKind = "event_completed" | "plan_created" | "photos_added";

export type FeedItem = {
  key: string;
  kind: FeedKind;
  actor: ProfileSummary;
  title: string;
  category: CategorySlug;
  coverUrl: string | null;
  href: string;
  occurredAt: string;
  count: number | null; // nº de fotos (photos_added)
};

const KINDS: FeedKind[] = ["event_completed", "plan_created", "photos_added"];

// Lo último de mis amigos: eventos realizados, propuestas nuevas y fotos
// (RPC get_friend_feed, security invoker: respeta la RLS de cada tabla).
export async function getFriendFeed(limit = 8): Promise<FeedItem[]> {
  if (DESIGN_PREVIEW) return previewFeed();

  const supabase = await createClient();
  const rows = unwrap(await supabase.rpc("get_friend_feed", { p_limit: limit }));
  const [profiles, covers] = await Promise.all([
    getProfilesByIds([...new Set(rows.map((r) => r.actor_id))]),
    signCoverUrls(
      supabase,
      rows.map((r) => r.cover_path),
    ),
  ]);

  return rows.flatMap((r): FeedItem[] => {
    const actor = profiles.get(r.actor_id);
    const kind = KINDS.find((k) => k === r.kind);
    if (!actor || !kind) return [];
    const data = (r.data ?? {}) as { count?: unknown };
    return [
      {
        key: `${kind}:${r.entity_id}:${r.actor_id}:${r.occurred_at}`,
        kind,
        actor,
        title: r.title,
        category: categoryFromId(r.category_id),
        coverUrl: r.cover_path ? (covers.get(r.cover_path) ?? null) : null,
        href: kind === "plan_created" ? `/plans/${r.entity_id}` : `/events/${r.entity_id}`,
        occurredAt: r.occurred_at,
        count: typeof data.count === "number" ? data.count : null,
      },
    ];
  });
}

async function previewFeed(): Promise<FeedItem[]> {
  const { events, plans } = await loadMocks();
  const done = events.filter((e) => e.status === "completed").slice(0, 2);
  return [
    ...done.map((e): FeedItem => ({
      key: `c:${e.id}`,
      kind: "event_completed",
      actor: e.host,
      title: e.title,
      category: e.category,
      coverUrl: e.coverUrl,
      href: `/events/${e.id}`,
      occurredAt: e.startsAt,
      count: null,
    })),
    ...plans.slice(0, 2).map((p): FeedItem => ({
      key: `p:${p.id}`,
      kind: "plan_created",
      actor: p.creator,
      title: p.title,
      category: p.category,
      coverUrl: p.coverUrl,
      href: `/plans/${p.id}`,
      occurredAt: p.createdAt,
      count: null,
    })),
  ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
