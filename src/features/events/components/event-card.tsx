import Link from "next/link";
import { CalendarClock, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { CategoryBadge } from "@/components/shared/category";
import { Cover } from "@/components/shared/cover";
import { DateBadge } from "@/components/shared/date-badge";
import { AvatarStack } from "@/components/shared/user-avatar";
import type { EventSummary } from "@/features/events/types";
import { cn } from "@/lib/utils";

import { EventWhen } from "./event-when";

// Tarjeta grande con portada: inicio, propuestas convertidas, historial.
export function EventCard({
  event,
  className,
  style,
}: {
  event: EventSummary;
  className?: string;
  style?: React.CSSProperties;
}) {
  const t = useTranslations("events");
  return (
    <Link
      href={`/events/${event.id}`}
      style={style}
      className={cn(
        "group bg-card hover:shadow-foreground/5 focus-visible:ring-ring/50 flex flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-3 focus-visible:outline-none",
        className,
      )}
    >
      <div className="relative">
        <Cover
          src={event.coverUrl}
          category={event.category}
          className="aspect-[16/9] w-full transition duration-500 group-hover:scale-[1.02]"
        />
        <DateBadge
          date={event.startsAt}
          timeZone={event.timezone}
          className="absolute top-3 left-3 shadow-sm"
        />
        {event.myRsvp === "pending" && (
          <span className="bg-accent text-accent-foreground absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm">
            {t("rsvpQuestion")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1.5">
          <CategoryBadge category={event.category} />
          <h3 className="text-lg leading-snug font-semibold text-balance">{event.title}</h3>
        </div>
        <dl className="text-muted-foreground space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <CalendarClock aria-hidden className="size-4 shrink-0" />
            <dd>
              <EventWhen event={event} />
            </dd>
          </div>
          {event.locationName && (
            <div className="flex items-center gap-2">
              <MapPin aria-hidden className="size-4 shrink-0" />
              <dd className="truncate">{event.locationName}</dd>
            </div>
          )}
        </dl>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <AvatarStack profiles={event.going} />
          <span className="text-muted-foreground text-xs">
            {t("going", { count: event.going.length })}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Fila compacta: agenda, listas de pendientes.
export function EventRow({ event, action }: { event: EventSummary; action?: React.ReactNode }) {
  const t = useTranslations("events");
  return (
    <div className="flex items-center gap-3 p-3 sm:p-4">
      <DateBadge date={event.startsAt} timeZone={event.timezone} />
      <Link
        href={`/events/${event.id}`}
        className="focus-visible:ring-ring/50 min-w-0 flex-1 rounded-md focus-visible:ring-3 focus-visible:outline-none"
      >
        <p className="truncate font-medium">{event.title}</p>
        <p className="text-muted-foreground truncate text-sm">
          <EventWhen event={event} withWeekday />
          {event.locationName && ` · ${event.locationName}`}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {event.myRsvp === null ? t("youHost") : t("host", { name: event.host.displayName })}
        </p>
      </Link>
      {action}
    </div>
  );
}
