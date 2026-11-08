import "server-only";

import { requestNow } from "@/lib/dates";
import { loadMocks } from "@/mocks/data";

// TODO(Fase 4–5): leer de Supabase (events + event_participants, RLS activa).

export async function getUpcomingEvents() {
  const [{ events }, now] = await Promise.all([loadMocks(), requestNow()]);
  return events
    .filter((e) => e.status === "scheduled" && new Date(e.startsAt) >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function getPendingRsvps() {
  return (await getUpcomingEvents()).filter((e) => e.myRsvp === "pending");
}

export async function getEventsBetween(from: Date, to: Date) {
  const { events } = await loadMocks();
  return events.filter((e) => {
    const t = Date.parse(e.startsAt);
    return t >= from.getTime() && t < to.getTime() && e.status !== "cancelled";
  });
}

export async function getEvent(id: string) {
  const { eventDetail } = await loadMocks();
  return eventDetail(id);
}
