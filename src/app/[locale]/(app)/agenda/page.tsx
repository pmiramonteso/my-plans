import { Suspense } from "react";
import { TZDate } from "@date-fns/tz";
import { addMonths } from "date-fns";
import { CalendarX2 } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { DemoNotice } from "@/components/shared/demo-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthCalendar } from "@/features/agenda/components/month-calendar";
import { EventRow } from "@/features/events/components/event-card";
import { RsvpButtons } from "@/features/events/components/rsvp-buttons";
import { getEventsBetween } from "@/features/events/queries";
import { requestNow } from "@/lib/dates";
import { pageTitle } from "@/lib/metadata";
import { capitalize } from "@/lib/utils";

export const generateMetadata = pageTitle("agenda.title");

// TODO(Fase 3): zona horaria del perfil.
const TIME_ZONE = "Europe/Madrid";

export default async function AgendaPage({ searchParams }: PageProps<"/[locale]/agenda">) {
  const t = await getTranslations("agenda");
  return (
    <>
      <DemoNotice />
      <PageHeader title={t("title")} description={t("subtitle")} />
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

function parseMonth(value: unknown, now: TZDate) {
  const match = typeof value === "string" && /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  return match
    ? new TZDate(Number(match[1]), Number(match[2]) - 1, 1, TIME_ZONE)
    : new TZDate(now.getFullYear(), now.getMonth(), 1, TIME_ZONE);
}

async function Agenda({ searchParams }: Pick<PageProps<"/[locale]/agenda">, "searchParams">) {
  const { m } = await searchParams;
  const [t, format, now] = await Promise.all([
    getTranslations("agenda"),
    getFormatter(),
    requestNow(),
  ]);
  const today = new TZDate(now, TIME_ZONE);
  const month = parseMonth(m, today);
  // Incluye los días visibles de los meses vecinos.
  const events = await getEventsBetween(addMonths(month, -1), addMonths(month, 2));
  const monthEvents = events
    .filter((e) => {
      const d = new TZDate(e.startsAt, TIME_ZONE);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-10">
        <MonthCalendar month={month} today={today} timeZone={TIME_ZONE} events={events} />
      </div>
      <section>
        <SectionHeader
          title={capitalize(format.dateTime(month, { month: "long", timeZone: TIME_ZONE }))}
          count={monthEvents.length}
        />
        {monthEvents.length === 0 ? (
          <EmptyState icon={CalendarX2} title={t("empty")} />
        ) : (
          <div className="bg-card divide-y overflow-hidden rounded-2xl border">
            {monthEvents.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                action={
                  e.myRsvp === "pending" && e.status === "scheduled" ? (
                    <div className="hidden sm:block">
                      <RsvpButtons rsvp="pending" size="sm" />
                    </div>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
