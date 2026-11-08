import { Suspense } from "react";
import Link from "next/link";
import { TZDate } from "@date-fns/tz";
import { addMonths } from "date-fns";
import { CalendarX2, CircleCheck } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthCalendar } from "@/features/agenda/components/month-calendar";
import {
  AGENDA_FILTERS,
  matchesAgendaFilter,
  parseAgendaFilter,
  parseMonthParam,
} from "@/features/agenda/filters";
import { EventRow } from "@/features/events/components/event-card";
import { RsvpButtons } from "@/features/events/components/rsvp-buttons";
import { getEventsBetween, getEventsToComplete } from "@/features/events/queries";
import { getCurrentProfile } from "@/features/profiles/queries";
import { requestNow } from "@/lib/dates";
import { pageTitle } from "@/lib/metadata";
import { capitalize } from "@/lib/utils";

export const generateMetadata = pageTitle("agenda.title");

export default async function AgendaPage({ searchParams }: PageProps<"/[locale]/agenda">) {
  const t = await getTranslations("agenda");
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Suspense fallback={null}>
        <ToComplete />
      </Suspense>
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
            <Skeleton className="aspect-square rounded-2xl" />
            <ListSkeleton />
          </div>
        }
      >
        <Agenda searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// Eventos que organizo, ya empezados y sin cerrar: hay que marcar quién vino.
async function ToComplete() {
  const [events, t, tEvents] = await Promise.all([
    getEventsToComplete(),
    getTranslations("agenda"),
    getTranslations("events"),
  ]);
  if (events.length === 0) return null;

  return (
    <section className="mb-8">
      <SectionHeader title={t("toComplete")} count={events.length} />
      <p className="text-muted-foreground -mt-2 mb-3 text-sm">{t("toCompleteHint")}</p>
      <div className="bg-card divide-y overflow-hidden rounded-2xl border">
        {events.map((e) => (
          <EventRow
            key={e.id}
            event={e}
            action={
              <Button asChild size="sm" variant="outline">
                <Link href={`/events/${e.id}/complete`} aria-label={tEvents("complete")}>
                  <CircleCheck data-icon="inline-start" />
                  <span className="hidden sm:inline">{t("completeShort")}</span>
                </Link>
              </Button>
            }
          />
        ))}
      </div>
    </section>
  );
}

async function Agenda({ searchParams }: Pick<PageProps<"/[locale]/agenda">, "searchParams">) {
  const { m, f } = await searchParams;
  const filter = parseAgendaFilter(f);
  const [t, format, now, me] = await Promise.all([
    getTranslations("agenda"),
    getFormatter(),
    requestNow(),
    getCurrentProfile(),
  ]);
  const timeZone = me.timezone;
  const today = new TZDate(now, timeZone);
  const parsed = parseMonthParam(m);
  const month = parsed
    ? new TZDate(parsed.year, parsed.month, 1, timeZone)
    : new TZDate(today.getFullYear(), today.getMonth(), 1, timeZone);

  // Incluye los días visibles de los meses vecinos.
  const events = (await getEventsBetween(addMonths(month, -1), addMonths(month, 2))).filter((e) =>
    matchesAgendaFilter(e, filter),
  );
  const monthEvents = events
    .filter((e) => {
      const d = new TZDate(e.startsAt, timeZone);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const query = { m: typeof m === "string" ? m : null, f: filter === "all" ? null : filter };

  return (
    <>
      <FilterTabs
        label={t("filterLabel")}
        value={filter}
        query={query}
        options={AGENDA_FILTERS.map((value) => ({ value, label: t(`filter.${value}`) }))}
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-10">
          <MonthCalendar
            month={month}
            today={today}
            timeZone={timeZone}
            events={events}
            query={query}
          />
        </div>
        <section>
          <SectionHeader
            title={capitalize(format.dateTime(month, { month: "long", timeZone }))}
            count={monthEvents.length}
          />
          {monthEvents.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title={filter === "all" ? t("empty") : t("emptyFiltered")}
            />
          ) : (
            <div className="bg-card divide-y overflow-hidden rounded-2xl border">
              {monthEvents.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  action={
                    e.myRsvp === "pending" && e.status === "scheduled" ? (
                      <div className="hidden sm:block">
                        <RsvpButtons eventId={e.id} rsvp="pending" size="sm" />
                      </div>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
