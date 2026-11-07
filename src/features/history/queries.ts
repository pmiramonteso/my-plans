import "server-only";

import { loadMocks } from "@/mocks/data";

// TODO(Fase 5): leer de la vista completed_participations.

export async function getHistory(withUsername?: string) {
  const { events } = await loadMocks();
  return events
    .filter((e) => e.status === "completed")
    .filter(
      (e) =>
        !withUsername ||
        e.going.some((g) => g.username === withUsername) ||
        e.host.username === withUsername,
    )
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}
