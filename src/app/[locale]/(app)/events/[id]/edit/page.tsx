import { Suspense } from "react";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EventForm } from "@/features/events/components/event-form";
import { getEvent } from "@/features/events/queries";
import { getFriends } from "@/features/friends/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("events.edit");

export default function EditEventPage({ params }: PageProps<"/[locale]/events/[id]/edit">) {
  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
        <Edit params={params} />
      </Suspense>
    </div>
  );
}

async function Edit({ params }: Pick<PageProps<"/[locale]/events/[id]/edit">, "params">) {
  const { id } = await params;
  const [event, friends, t, tCommon] = await Promise.all([
    getEvent(id),
    getFriends(),
    getTranslations("events"),
    getTranslations("common"),
  ]);
  if (!event) notFound();

  // Fecha y hora locales del evento (en su propia zona horaria).
  const start = new TZDate(event.startsAt, event.timezone);
  const end = event.endsAt ? new TZDate(event.endsAt, event.timezone) : null;

  return (
    <>
      <PageHeader
        title={t("edit")}
        description={t("editSubtitle")}
        backHref={`/events/${event.id}`}
        backLabel={tCommon("back")}
      />
      <EventForm
        friends={friends}
        submitLabel={tCommon("save")}
        showInvite={false}
        defaults={{
          title: event.title,
          category: event.category,
          description: event.description,
          location: event.locationName,
          link: event.externalUrl,
          extraInfo: event.extraInfo,
          allDay: event.allDay,
          date: format(start, "yyyy-MM-dd"),
          startTime: format(start, "HH:mm"),
          endTime: end ? format(end, "HH:mm") : undefined,
        }}
      />
    </>
  );
}
