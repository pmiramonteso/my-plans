import "server-only";

import { categoryFromId, type CategorySlug } from "@/features/categories/config";
import { getEventSummaries } from "@/features/events/queries";
import type { EventSummary } from "@/features/events/types";
import { getCurrentProfile } from "@/features/profiles/queries";
import { unwrap } from "@/lib/action";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";
import { loadMocks } from "@/mocks/data";

import { applyHistoryFilter, sharedRows, type HistoryFilter, type HistoryRow } from "./filters";

export type History = {
  events: EventSummary[];
  years: number[];
  categories: CategorySlug[];
};

// Mi historial o el compartido con un amigo (eventos a los que fuimos los dos).
// Sale de completed_participations: solo eventos realizados a los que se asistió.
// TODO(Fase 7): paginación keyset si el historial crece mucho.
export async function getHistory(
  filter: HistoryFilter,
  friend?: { id: string; username: string },
): Promise<History> {
  if (DESIGN_PREVIEW) return previewHistory(filter, friend?.username);

  const [me, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const users = friend ? [me.id, friend.id] : [me.id];
  const data = unwrap(
    await supabase
      .from("completed_participations")
      .select("event_id, user_id, starts_at, timezone, category_id")
      .in("user_id", users),
  );
  const rows: HistoryRow[] = data.map((r) => ({
    eventId: r.event_id,
    userId: r.user_id,
    startsAt: r.starts_at,
    timezone: r.timezone,
    category: categoryFromId(r.category_id),
  }));

  const { eventIds, years, categories } = applyHistoryFilter(sharedRows(rows, users), filter);
  return { events: await getEventSummaries(eventIds), years, categories };
}

async function previewHistory(filter: HistoryFilter, withUsername?: string): Promise<History> {
  const { events } = await loadMocks();
  const done = events
    .filter((e) => e.status === "completed")
    .filter(
      (e) =>
        !withUsername ||
        e.going.some((g) => g.username === withUsername) ||
        e.host.username === withUsername,
    );
  const { eventIds, years, categories } = applyHistoryFilter(
    done.map((e) => ({
      eventId: e.id,
      userId: "me",
      startsAt: e.startsAt,
      timezone: e.timezone,
      category: e.category,
    })),
    filter,
  );
  return {
    events: done
      .filter((e) => eventIds.includes(e.id))
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    years,
    categories,
  };
}
