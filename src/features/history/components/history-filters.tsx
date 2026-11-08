import { useTranslations } from "next-intl";

import { FilterTabs } from "@/components/shared/filter-tabs";
import type { CategorySlug } from "@/features/categories/config";
import type { HistoryFilter } from "@/features/history/filters";

// Año (?y=) y categoría (?c=). El año también filtra las estadísticas.
export function HistoryFilters({
  filter,
  years,
  categories,
}: {
  filter: HistoryFilter;
  years: number[];
  categories: CategorySlug[];
}) {
  const t = useTranslations();
  const query = {
    y: filter.year === null ? null : String(filter.year),
    c: filter.category,
  };

  return (
    <div className="flex flex-col items-start gap-3">
      {years.length > 1 || filter.year !== null ? (
        <FilterTabs
          label={t("history.filterYear")}
          param="y"
          query={query}
          className="mb-0"
          value={query.y ?? "all"}
          options={[
            { value: "all", label: t("history.allYears") },
            ...years.map((y) => ({ value: String(y), label: String(y) })),
          ]}
        />
      ) : null}
      {categories.length > 1 || filter.category !== null ? (
        <FilterTabs
          label={t("categories.label")}
          param="c"
          query={query}
          className="mb-0"
          value={filter.category ?? "all"}
          options={[
            { value: "all", label: t("history.allCategories") },
            ...categories.map((c) => ({ value: c, label: t(`categories.${c}`) })),
          ]}
        />
      ) : null}
    </div>
  );
}
