import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { DemoNotice } from "@/components/shared/demo-notice";
import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { HistoryView } from "@/features/history/components/history-view";
import { getHistory } from "@/features/history/queries";
import { getMyStats } from "@/features/stats/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("history.title");

export default async function HistoryPage() {
  const t = await getTranslations("history");
  return (
    <>
      <DemoNotice />
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Suspense fallback={<CardGridSkeleton count={6} />}>
        <History />
      </Suspense>
    </>
  );
}

async function History() {
  const [stats, events] = await Promise.all([getMyStats(), getHistory()]);
  return <HistoryView stats={stats} events={events} />;
}
