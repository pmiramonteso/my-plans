import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/shared/skeletons";
import { AttendanceForm } from "@/features/events/components/attendance-form";
import { getEvent } from "@/features/events/queries";
import { requestNow } from "@/lib/dates";
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
  const [event, t, now] = await Promise.all([
    getEvent(id),
    getTranslations("events"),
    requestNow(),
  ]);
  if (!event) notFound();
  // Solo el organizador, con el evento programado y ya empezado (la RPC
  // complete_event lo vuelve a comprobar).
  const canComplete =
    event.myRsvp === null && event.status === "scheduled" && new Date(event.startsAt) <= now;
  if (!canComplete) redirect(`/events/${event.id}`);

  return (
    <>
      <PageHeader
        title={t("completeTitle")}
        description={t("completeSubtitle")}
        backHref={`/events/${event.id}`}
        backLabel={event.title}
      />
      <AttendanceForm eventId={event.id} participants={event.participants} />
    </>
  );
}
