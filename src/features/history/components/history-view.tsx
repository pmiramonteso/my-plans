import { Mountain, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/page-header";
import { EventCard } from "@/features/events/components/event-card";
import { HistoryFilters } from "@/features/history/components/history-filters";
import { eventYear, type HistoryFilter } from "@/features/history/filters";
import type { History } from "@/features/history/queries";
import { ClimbedPeaks } from "@/features/stats/components/climbed-peaks";
import { StatGrid } from "@/features/stats/components/stat-grid";
import type { UserStats } from "@/features/stats/types";

// Filtros, estadísticas y experiencias agrupadas por año (personal y compartido).
export function HistoryView({
  stats,
  history,
  filter,
}: {
  stats: UserStats;
  history: History;
  filter: HistoryFilter;
}) {
  const t = useTranslations("history");
  const { events, years, categories } = history;
  const filtered = filter.year !== null || filter.category !== null;

  if (events.length === 0 && !filtered) {
    return <EmptyState icon={Mountain} title={t("empty")} description={t("emptyHint")} />;
  }

  const byYear = Map.groupBy(events, (e) => eventYear(e.startsAt, e.timezone));

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <HistoryFilters filter={filter} years={years} categories={categories} />
        <StatGrid stats={stats} />
      </div>
      <ClimbedPeaks peaks={history.peaks} />
      <section className="space-y-8">
        <SectionHeader title={t("timeline")} count={events.length} />
        {events.length === 0 ? (
          <EmptyState icon={SearchX} title={t("emptyFiltered")} />
        ) : (
          [...byYear].map(([year, list]) => (
            <div key={year} className="relative">
              <h3 className="font-heading text-muted-foreground/40 mb-4 text-4xl font-semibold tabular-nums">
                {year}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
