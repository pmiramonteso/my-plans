import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/shared/skeletons";
import { AttendanceForm } from "@/features/events/components/attendance-form";
import { getEvent } from "@/features/events/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("events.complete");

export default function CompleteEventPage({ params }: PageProps<"/[locale]/events/[id]/complete">) {
  return (
    <div className="mx-auto max-w-2xl">
      <Suspense fallback={<ListSkeleton count={5} />}>
        <Complete params={params} />
      </Suspense>
    </div>
  );
}

async function Complete({ params }: Pick<PageProps<"/[locale]/events/[id]/complete">, "params">) {
  const { id } = await params;
  const [event, t] = await Promise.all([getEvent(id), getTranslations("events")]);
  if (!event) notFound();

  return (
    <>
      <PageHeader
        title={t("completeTitle")}
        description={t("completeSubtitle")}
        backHref={`/events/${event.id}`}
        backLabel={event.title}
      />
      <AttendanceForm participants={event.participants} />
    </>
  );
}
