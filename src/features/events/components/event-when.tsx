import { useFormatter, useTranslations } from "next-intl";

import type { EventSummary } from "@/features/events/types";

// "sáb, 14 nov · 07:00–18:00" en la zona horaria del propio evento.
export function EventWhen({
  event,
  withWeekday = true,
}: {
  event: Pick<EventSummary, "startsAt" | "endsAt" | "allDay" | "timezone">;
  withWeekday?: boolean;
}) {
  const format = useFormatter();
  const t = useTranslations("events");
  const timeZone = event.timezone;
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : null;

  const day = format.dateTime(start, {
    weekday: withWeekday ? "short" : undefined,
    day: "numeric",
    month: "short",
    timeZone,
  });

  if (event.allDay) {
    if (!end) return `${day} · ${t("allDay")}`;
    return format.dateTimeRange(start, end, { day: "numeric", month: "short", timeZone });
  }

  const time = (d: Date) => format.dateTime(d, { hour: "2-digit", minute: "2-digit", timeZone });
  return end ? `${day} · ${time(start)}–${time(end)}` : `${day} · ${time(start)}`;
}
