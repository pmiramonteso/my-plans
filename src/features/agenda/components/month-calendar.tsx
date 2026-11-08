import Link from "next/link";
import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  format as formatDate,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CATEGORIES, CATEGORY_TONE } from "@/features/categories/config";
import type { EventSummary } from "@/features/events/types";
import { capitalize, cn } from "@/lib/utils";

// Calendario mensual propio (lunes primero). Cada día muestra un punto por
// evento con el color de su categoría.
export function MonthCalendar({
  month,
  today,
  timeZone,
  events,
}: {
  month: TZDate; // primer día del mes, en la zona del usuario
  today: TZDate;
  timeZone: string;
  events: EventSummary[];
}) {
  const t = useTranslations("agenda");
  const format = useFormatter();

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  // Quita la última semana si es entera del mes siguiente.
  const visible = isSameMonth(days[35], month) ? days : days.slice(0, 35);

  const eventsOn = (day: Date) =>
    events.filter((e) => isSameDay(new TZDate(e.startsAt, timeZone), day));

  const monthParam = (d: Date) => `?m=${formatDate(d, "yyyy-MM")}`;

  return (
    <div className="bg-card rounded-2xl border p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="pl-1 text-xl font-semibold">
          {capitalize(format.dateTime(month, { month: "long", year: "numeric", timeZone }))}
        </h2>
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={monthParam(addMonths(month, -1))} aria-label={t("previous")} scroll={false}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={monthParam(addMonths(month, 1))} aria-label={t("next")} scroll={false}>
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </div>

      <div className="text-muted-foreground grid grid-cols-7 text-center text-xs font-medium">
        {visible.slice(0, 7).map((d) => (
          <div key={d.toISOString()} className="pb-2" aria-hidden>
            {format.dateTime(d, { weekday: "narrow", timeZone })}
          </div>
        ))}
      </div>

      <ol className="grid grid-cols-7 gap-1">
        {visible.map((day) => {
          const dayEvents = eventsOn(day);
          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);
          return (
            <li
              key={day.toISOString()}
              aria-label={`${format.dateTime(day, { dateStyle: "full", timeZone })}: ${t("dayEvents", { count: dayEvents.length })}`}
              className={cn(
                "flex aspect-square flex-col items-center justify-start gap-1 rounded-lg pt-1.5 text-sm tabular-nums sm:aspect-[4/3]",
                !inMonth && "text-muted-foreground/50",
                dayEvents.length > 0 && inMonth && "bg-secondary/60",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground font-semibold",
                )}
              >
                {format.dateTime(day, { day: "numeric", timeZone })}
              </span>
              {dayEvents.length > 0 && (
                <span className="flex gap-0.5" aria-hidden>
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={cn(
                        "size-1.5 rounded-full",
                        CATEGORY_TONE[CATEGORIES[e.category].color].bg,
                      )}
                    />
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
