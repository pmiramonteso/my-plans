import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EventForm } from "@/features/events/components/event-form";
import { getFriends } from "@/features/friends/queries";
import { getPlan } from "@/features/plans/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("plans.scheduleTitle");

export default function SchedulePlanPage({ params }: PageProps<"/[locale]/plans/[id]/schedule">) {
  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
        <Schedule params={params} />
      </Suspense>
    </div>
  );
}

// Formulario prerrellenado con la propuesta; los interesados ya vienen marcados.
async function Schedule({ params }: Pick<PageProps<"/[locale]/plans/[id]/schedule">, "params">) {
  const { id } = await params;
  const [plan, friends, t, tCreate, tCommon] = await Promise.all([
    getPlan(id),
    getFriends(),
    getTranslations("plans"),
    getTranslations("create"),
    getTranslations("common"),
  ]);
  if (!plan) notFound();

  return (
    <>
      <PageHeader
        title={t("scheduleTitle")}
        description={t("scheduleSubtitle")}
        backHref={`/plans/${plan.id}`}
        backLabel={tCommon("back")}
      />
      <EventForm
        friends={friends}
        submitLabel={tCreate("submitEvent")}
        defaults={{
          title: plan.title,
          category: plan.category,
          description: plan.description,
          location: plan.locationName,
          link: plan.externalUrl,
          visibility: plan.visibility === "friends" ? "friends" : "invited",
          invitees: plan.invitations
            .filter((i) => i.interest === "interested")
            .map((i) => i.profile.id),
        }}
      />
    </>
  );
}
