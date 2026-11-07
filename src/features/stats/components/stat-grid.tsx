import { useFormatter, useTranslations } from "next-intl";

import { CategoryIcon } from "@/components/shared/category";
import type { CategorySlug } from "@/features/categories/config";
import type { StatKey, UserStats } from "@/features/stats/types";

// stat_key → slug de la categoría (para el icono y el color).
const STAT_CATEGORY: Record<StatKey, CategorySlug> = {
  hikes: "hiking",
  summits: "summit",
  museums: "museum",
  restaurants: "restaurant",
  trips: "trip",
  cities: "city",
  other: "other",
};

export function StatGrid({ stats }: { stats: UserStats }) {
  const t = useTranslations("stats");
  const format = useFormatter();
  const categories = (Object.keys(STAT_CATEGORY) as StatKey[]).filter(
    (k) => (stats.byCategory[k] ?? 0) > 0,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label={t("total")} value={format.number(stats.total)} highlight />
        <Tile label={t("distinctPlaces")} value={format.number(stats.distinctPlaces)} />
        <Tile
          label={t("elevation")}
          value={format.number(stats.elevationGainM, { style: "unit", unit: "meter" })}
        />
        <Tile
          label={t("distance")}
          value={format.number(stats.distanceKm, { style: "unit", unit: "kilometer" })}
        />
      </div>
      <ul className="flex flex-wrap gap-2">
        {categories.map((k) => (
          <li
            key={k}
            className="bg-card flex items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-2.5 text-sm"
          >
            <CategoryIcon category={STAT_CATEGORY[k]} />
            <span className="font-semibold tabular-nums">{stats.byCategory[k]}</span>
            <span className="text-muted-foreground">{t(k)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        highlight
          ? "bg-primary text-primary-foreground rounded-2xl p-4"
          : "bg-card rounded-2xl border p-4"
      }
    >
      <p className="font-heading text-3xl font-semibold tabular-nums">{value}</p>
      <p className={highlight ? "text-sm opacity-85" : "text-muted-foreground text-sm"}>{label}</p>
    </div>
  );
}
