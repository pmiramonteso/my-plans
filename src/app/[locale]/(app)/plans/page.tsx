import { Suspense } from "react";
import Link from "next/link";
import { Lightbulb, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/features/plans/components/plan-card";
import { getPlans, type PlanFilter } from "@/features/plans/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("plans.title");

const FILTERS: PlanFilter[] = ["all", "mine", "invited"];

export default async function PlansPage({ searchParams }: PageProps<"/[locale]/plans">) {
  const [t, tCreate] = await Promise.all([getTranslations("plans"), getTranslations("create")]);
  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/create/plan">
              <Plus data-icon="inline-start" />
              {tCreate("newPlan")}
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<CardGridSkeleton count={6} />}>
        <PlanList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PlanList({ searchParams }: Pick<PageProps<"/[locale]/plans">, "searchParams">) {
  const { f } = await searchParams;
  const filter = FILTERS.find((x) => x === f) ?? "all";
  const [t, tCreate, plans] = await Promise.all([
    getTranslations("plans"),
    getTranslations("create"),
    getPlans(filter),
  ]);

  return (
    <>
      <FilterTabs
        label={t("title")}
        value={filter}
        options={FILTERS.map((value) => ({ value, label: t(`filter.${value}`) }))}
      />
      {plans.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={t("empty")}
          description={t("emptyHint")}
          action={
            <Button asChild>
              <Link href="/create/plan">{tCreate("newPlan")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </div>
      )}
    </>
  );
}
