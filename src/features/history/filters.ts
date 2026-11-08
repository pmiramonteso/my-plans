import { TZDate } from "@date-fns/tz";

import { CATEGORY_SLUGS, type CategorySlug } from "@/features/categories/config";

// Filtros del historial en la URL: ?y=2026&c=summit (los dos opcionales).
export type HistoryFilter = { year: number | null; category: CategorySlug | null };

// Una fila de completed_participations: (usuario, evento realizado al que asistió).
export type HistoryRow = {
  eventId: string;
  userId: string;
  startsAt: string;
  timezone: string;
  category: CategorySlug;
};

type Param = string | string[] | undefined;

export function parseHistoryFilter({ y, c }: { y?: Param; c?: Param }): HistoryFilter {
  const year = typeof y === "string" && /^\d{4}$/.test(y) ? Number(y) : null;
  const category = CATEGORY_SLUGS.find((slug) => slug === c) ?? null;
  return { year, category };
}

// Año del evento en su propia zona (igual que compute_stats en la BD).
export function eventYear(startsAt: string, timeZone: string) {
  return new TZDate(startsAt, timeZone).getFullYear();
}

// Eventos a los que asistieron TODOS los usuarios (historial compartido),
// una fila por evento.
export function sharedRows(rows: HistoryRow[], users: string[]): HistoryRow[] {
  const byEvent = Map.groupBy(rows, (r) => r.eventId);
  return [...byEvent.values()].flatMap((list) =>
    users.every((u) => list.some((r) => r.userId === u)) ? [list[0]] : [],
  );
}

// Aplica el filtro y calcula las opciones: años (del más reciente al más
// antiguo) y categorías del año elegido, en el orden de la app.
export function applyHistoryFilter(rows: HistoryRow[], filter: HistoryFilter) {
  const years = new Set(rows.map((r) => eventYear(r.startsAt, r.timezone)));
  if (filter.year !== null) years.add(filter.year);

  const inYear = rows.filter(
    (r) => filter.year === null || eventYear(r.startsAt, r.timezone) === filter.year,
  );
  const present = new Set(inYear.map((r) => r.category));
  if (filter.category) present.add(filter.category);

  const matching = inYear.filter((r) => !filter.category || r.category === filter.category);
  return {
    eventIds: [...new Set(matching.map((r) => r.eventId))],
    years: [...years].sort((a, b) => b - a),
    categories: CATEGORY_SLUGS.filter((slug) => present.has(slug)),
  };
}
