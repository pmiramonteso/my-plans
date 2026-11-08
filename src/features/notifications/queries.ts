import "server-only";

import { getCurrentProfile, getProfilesByIds } from "@/features/profiles/queries";
import { unwrap } from "@/lib/action";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";
import { loadMocks } from "@/mocks/data";

import { encodeCursor, notificationHref, type NotificationCursor } from "./links";
import type { AppNotification } from "./types";

const PAGE_SIZE = 30;

// Mis notificaciones (la RLS solo deja ver las propias), de la más reciente a
// la más antigua, con paginación keyset por (created_at, id).
export async function getNotifications(
  before: NotificationCursor | null = null,
): Promise<{ notifications: AppNotification[]; next: string | null }> {
  if (DESIGN_PREVIEW) return { notifications: (await loadMocks()).notifications, next: null };

  const [me, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  let query = supabase
    .from("notifications")
    .select("id, actor_id, type, entity_type, entity_id, data, read_at, created_at")
    .eq("recipient_id", me.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (before) {
    query = query.or(
      `created_at.lt."${before.createdAt}",and(created_at.eq."${before.createdAt}",id.lt.${before.id})`,
    );
  }
  const rows = unwrap(await query);
  const page = rows.slice(0, PAGE_SIZE);

  const profiles = await getProfilesByIds([
    ...new Set(
      page.flatMap((n) => [
        ...(n.actor_id ? [n.actor_id] : []),
        ...(n.entity_type === "profile" ? [n.entity_id] : []),
      ]),
    ),
  ]);

  const notifications = page.map((n): AppNotification => {
    const data = (n.data ?? {}) as { title?: unknown; count?: unknown };
    return {
      id: n.id,
      type: n.type,
      actor: n.actor_id ? (profiles.get(n.actor_id) ?? null) : null,
      href: notificationHref(
        n.type,
        n.entity_type,
        n.entity_id,
        n.entity_type === "profile" ? (profiles.get(n.entity_id)?.username ?? null) : null,
      ),
      data: {
        title: typeof data.title === "string" ? data.title : undefined,
        count: typeof data.count === "number" ? data.count : undefined,
      },
      readAt: n.read_at,
      createdAt: n.created_at,
    };
  });

  const last = page.at(-1);
  return {
    notifications,
    next:
      rows.length > PAGE_SIZE && last
        ? encodeCursor({ createdAt: last.created_at, id: last.id })
        : null,
  };
}

// La RLS limita la cuenta a mis notificaciones.
export async function getUnreadCount() {
  if (DESIGN_PREVIEW) {
    return (await loadMocks()).notifications.filter((n) => !n.readAt).length;
  }
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}
