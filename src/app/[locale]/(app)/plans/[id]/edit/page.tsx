import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getFriends } from "@/features/friends/queries";
import { PlanForm } from "@/features/plans/components/plan-form";
import { getPlan } from "@/features/plans/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("plans.edit");

export default function EditPlanPage({ params }: PageProps<"/[locale]/plans/[id]/edit">) {
  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
        <Edit params={params} />
      </Suspense>
    </div>
  );
}

async function Edit({ params }: Pick<PageProps<"/[locale]/plans/[id]/edit">, "params">) {
  const { id } = await params;
  const [plan, friends, t, tCommon] = await Promise.all([
    getPlan(id),
    getFriends(),
    getTranslations("plans"),
    getTranslations("common"),
  ]);
  // Solo el creador (myInterest null).
  if (!plan || plan.myInterest !== null) notFound();

  const invited = new Set(plan.invitations.map((i) => i.profile.id));

  return (
    <>
      <PageHeader title={t("edit")} backHref={`/plans/${plan.id}`} backLabel={tCommon("back")} />
      <PlanForm
        planId={plan.id}
        friends={friends.filter((f) => !invited.has(f.id))}
        coverUrl={plan.coverUrl}
        defaults={{
          title: plan.title,
          category: plan.category,
          description: plan.description ?? "",
          location: plan.locationName ?? "",
          link: plan.externalUrl ?? "",
          difficulty: plan.difficulty
            ? (String(plan.difficulty) as "1" | "2" | "3" | "4" | "5")
            : null,
          visibility: plan.visibility,
        }}
      />
    </>
  );
}
