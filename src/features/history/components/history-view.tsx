import { Mountain } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/page-header";
import { EventCard } from "@/features/events/components/event-card";
import type { EventSummary } from "@/features/events/types";
import { StatGrid } from "@/features/stats/components/stat-grid";
import type { UserStats } from "@/features/stats/types";

// Estadísticas arriba y experiencias agrupadas por año (personal y compartido).
export function HistoryView({ stats, events }: { stats: UserStats; events: EventSummary[] }) {
  const t = useTranslations("history");

  if (events.length === 0) {
    return <EmptyState icon={Mountain} title={t("empty")} description={t("emptyHint")} />;
  }

  const byYear = Map.groupBy(events, (e) =>
    new Date(e.startsAt).toLocaleString("en", { year: "numeric", timeZone: e.timezone }),
  );

  return (
    <div className="space-y-10">
      <StatGrid stats={stats} />
      <section className="space-y-8">
        <SectionHeader title={t("timeline")} count={events.length} />
        {[...byYear].map(([year, list]) => (
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
        ))}
      </section>
    </div>
  );
}
