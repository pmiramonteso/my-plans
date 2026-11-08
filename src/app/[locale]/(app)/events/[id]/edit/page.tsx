import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EventForm } from "@/features/events/components/event-form";
import { fromEventTimes } from "@/features/events/dates";
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
  // Solo el organizador, y solo mientras esté programado.
  if (!event || event.myRsvp !== null || event.status !== "scheduled") notFound();

  const invited = new Set(event.participants.map((p) => p.profile.id));

  return (
    <>
      <PageHeader
        title={t("edit")}
        description={t("editSubtitle")}
        backHref={`/events/${event.id}`}
        backLabel={tCommon("back")}
      />
      <EventForm
        eventId={event.id}
        // Se puede invitar a más amigos; los ya invitados no se quitan desde aquí.
        friends={friends.filter((f) => !invited.has(f.id))}
        timezone={event.timezone}
        coverUrl={event.coverUrl}
        defaults={{
          title: event.title,
          category: event.category,
          description: event.description ?? "",
          location: event.locationName ?? "",
          link: event.externalUrl ?? "",
          extraInfo: event.extraInfo ?? "",
          visibility: event.visibility === "friends" ? "friends" : "invited",
          ...fromEventTimes(event, event.timezone),
        }}
      />
    </>
  );
}
