import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { HistoryView } from "@/features/history/components/history-view";
import { parseHistoryFilter } from "@/features/history/filters";
import { getHistory } from "@/features/history/queries";
import { getMyStats } from "@/features/stats/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("history.title");

export default async function HistoryPage({ searchParams }: PageProps<"/[locale]/history">) {
  const t = await getTranslations("history");
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Suspense fallback={<CardGridSkeleton count={6} />}>
        <History searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function History({ searchParams }: Pick<PageProps<"/[locale]/history">, "searchParams">) {
  const filter = parseHistoryFilter(await searchParams);
  const [stats, history] = await Promise.all([getMyStats(filter.year), getHistory(filter)]);
  return <HistoryView stats={stats} history={history} filter={filter} />;
}
