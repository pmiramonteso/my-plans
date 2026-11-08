import { MountainSnow } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { SectionHeader } from "@/components/shared/page-header";
import type { ClimbedPeak } from "@/features/stats/types";

// Cimas conseguidas, de la más alta a la más baja, con ascensiones y la última vez.
export function ClimbedPeaks({ peaks }: { peaks: ClimbedPeak[] }) {
  const t = useTranslations("stats");
  const format = useFormatter();
  if (peaks.length === 0) return null;

  return (
    <section>
      <SectionHeader title={t("climbedPeaks")} count={peaks.length} />
      <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
        {peaks.map((peak) => (
          <li key={peak.id} className="flex items-center gap-3 px-4 py-3">
            <span className="bg-cat-granite/12 text-cat-granite flex size-9 shrink-0 items-center justify-center rounded-full">
              <MountainSnow aria-hidden className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{peak.name}</span>
              <span className="text-muted-foreground block text-xs">
                {t("lastAscent", {
                  date: format.dateTime(new Date(peak.lastAt), { dateStyle: "medium" }),
                })}
              </span>
            </span>
            <span className="text-right text-sm tabular-nums">
              <span className="block font-semibold">
                {format.number(peak.altitudeM, { style: "unit", unit: "meter" })}
              </span>
              {peak.ascents > 1 && (
                <span className="text-muted-foreground block text-xs">
                  {t("ascents", { count: peak.ascents })}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
