import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EventForm } from "@/features/events/components/event-form";
import { getFriends } from "@/features/friends/queries";
import { getCurrentProfile } from "@/features/profiles/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("create.newEvent");

export default async function NewEventPage() {
  const [t, tCommon] = await Promise.all([getTranslations("create"), getTranslations("common")]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t("newEvent")}
        description={t("eventHint")}
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
  const [friends, profile] = await Promise.all([getFriends(), getCurrentProfile()]);
  return <EventForm friends={friends} timezone={profile.timezone} />;
}
