import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getFriends } from "@/features/friends/queries";
import { PlanForm } from "@/features/plans/components/plan-form";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("create.newPlan");

export default async function NewPlanPage() {
  const [t, tCommon] = await Promise.all([getTranslations("create"), getTranslations("common")]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t("newPlan")}
        description={t("planHint")}
        backHref="/create"
        backLabel={tCommon("back")}
      />
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  return <PlanForm friends={await getFriends()} />;
}
