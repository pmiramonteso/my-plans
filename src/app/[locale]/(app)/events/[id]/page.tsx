import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  Camera,
  CircleCheck,
  ExternalLink,
  ImagePlus,
  Info,
  Lightbulb,
  MapPin,
  MountainSnow,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CategoryBadge } from "@/components/shared/category";
import { Cover } from "@/components/shared/cover";
import { DetailHero, Fact, Panel, Prose } from "@/components/shared/detail";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventManage } from "@/features/events/components/event-manage";
import { EventWhen } from "@/features/events/components/event-when";
import { RsvpButtons } from "@/features/events/components/rsvp-buttons";
import { getEvent } from "@/features/events/queries";
import type { EventDetail, RsvpStatus } from "@/features/events/types";
import { requestNow } from "@/lib/dates";
import { pageTitle } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const generateMetadata = pageTitle("nav.agenda");

export default function EventPage({ params }: PageProps<"/[locale]/events/[id]">) {
  return (
    <>
      <Suspense fallback={<DetailSkeleton />}>
        <EventContent params={params} />
      </Suspense>
    </>
  );
}

const RSVP_TONE: Record<RsvpStatus, string> = {
  going: "bg-primary/12 text-primary",
  pending: "bg-secondary text-muted-foreground",
  not_going: "bg-secondary text-muted-foreground line-through decoration-1",
};

async function EventContent({ params }: Pick<PageProps<"/[locale]/events/[id]">, "params">) {
  const { id } = await params;
  const [event, t] = await Promise.all([getEvent(id), getTranslations("events")]);
  if (!event) notFound();

  const isHost = event.myRsvp === null;
  const completed = event.status === "completed";

  return (
    <article>
      <DetailHero>
        <Cover src={event.coverUrl} category={event.category} iconClassName="size-16" />
      </DetailHero>

      <header className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={event.category} />
          <Badge variant={completed ? "default" : "secondary"}>
            {completed && <CircleCheck />}
            {t(`status.${event.status}`)}
          </Badge>
          {event.planId && (
            <Badge variant="outline" asChild>
              <Link href={`/plans/${event.planId}`}>
                <Lightbulb /> {t("fromPlan")}
              </Link>
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-semibold text-balance md:text-4xl">{event.title}</h1>
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <UserAvatar profile={event.host} size="xs" />
          {isHost ? t("youHost") : t("host", { name: event.host.displayName })}
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Panel className="lg:hidden">
            <EventAction event={event} isHost={isHost} />
          </Panel>

          <Panel>
            <ul className="space-y-3 text-sm">
              <Fact icon={CalendarClock}>
                <span className="font-medium first-letter:uppercase">
                  <EventWhen event={event} />
                </span>
              </Fact>
              {event.locationName && (
                <Fact icon={MapPin}>
                  <span className="font-medium">{event.locationName}</span>
                </Fact>
              )}
              {event.peaks.map((peak) => (
                <Fact key={peak.id} icon={MountainSnow}>
                  <span className="font-medium">{peak.name}</span> · {peak.altitudeM} m
                  <span className="text-muted-foreground block">
                    {[
                      peak.elevationGainM && t("elevation", { value: peak.elevationGainM }),
                      peak.distanceKm && t("distance", { value: peak.distanceKm }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Fact>
              ))}
              {event.externalUrl && (
                <Fact icon={ExternalLink}>
                  <a
                    href={event.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    {new URL(event.externalUrl).hostname}
                  </a>
                </Fact>
              )}
            </ul>
          </Panel>

          {event.description && (
            <Panel title={t("details")}>
              <Prose text={event.description} />
            </Panel>
          )}

          {event.extraInfo && (
            <div className="bg-cat-sunrise/15 flex gap-3 rounded-2xl p-4 text-sm">
              <Info aria-hidden className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-medium">{t("extraInfo")}</p>
                <p className="text-muted-foreground">{event.extraInfo}</p>
              </div>
            </div>
          )}

          <Gallery event={event} />
        </div>

        <aside className="space-y-6">
          <Panel className="hidden lg:block">
            <EventAction event={event} isHost={isHost} />
          </Panel>

          <Panel title={t("participants")}>
            <ul className="space-y-3">
              {event.participants.map(({ profile, rsvp, attended, role }) => (
                <li key={profile.id} className="flex items-center gap-3">
                  <UserAvatar profile={profile} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {profile.displayName}
                    {role === "host" && (
                      <span className="text-muted-foreground ml-1.5 text-xs font-normal">★</span>
                    )}
                  </span>
                  {completed ? (
                    attended && (
                      <span className="text-primary flex items-center gap-1 text-xs font-medium">
                        <CircleCheck aria-hidden className="size-3.5" /> {t("attended")}
                      </span>
                    )
                  ) : (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        RSVP_TONE[rsvp],
                      )}
                    >
                      {t(`rsvp.${rsvp}`)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </article>
  );
}

async function EventAction({ event, isHost }: { event: EventDetail; isHost: boolean }) {
  const [t, now] = await Promise.all([getTranslations("events"), requestNow()]);

  if (event.status === "completed") {
    return (
      <Button variant="outline" className="w-full">
        <ImagePlus data-icon="inline-start" />
        {t("addPhotos")}
      </Button>
    );
  }

  if (isHost) {
    return (
      <EventManage id={event.id} status={event.status} started={new Date(event.startsAt) <= now} />
    );
  }

  if (event.status === "cancelled") {
    return <p className="text-muted-foreground text-sm">{t("cancelledHint")}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="font-heading text-lg font-semibold">{t("rsvpQuestion")}</p>
      <RsvpButtons eventId={event.id} rsvp={event.myRsvp ?? "pending"} />
    </div>
  );
}

async function Gallery({ event }: { event: EventDetail }) {
  const t = await getTranslations("events");
  return (
    <Panel
      title={t("gallery")}
      action={
        event.photoCount > 0 && (
          <span className="text-muted-foreground text-sm">
            {t("photos", { count: event.photoCount })}
          </span>
        )
      }
    >
      {event.photos.length === 0 ? (
        <EmptyState
          icon={Camera}
          title={t("noPhotos")}
          description={t("noPhotosHint")}
          className="border-none py-6"
        />
      ) : (
        <ul className="columns-2 gap-2 sm:columns-3 [&>li]:mb-2">
          {event.photos.map((photo) => (
            <li key={photo.id} className="break-inside-avoid overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                width={photo.width}
                height={photo.height}
                loading="lazy"
                className="bg-muted h-auto w-full transition duration-300 hover:scale-[1.03]"
              />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
