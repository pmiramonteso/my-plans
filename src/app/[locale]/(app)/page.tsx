import { Suspense } from "react";
import Link from "next/link";
import { TZDate } from "@date-fns/tz";
import { CalendarPlus, PartyPopper } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/page-header";
import { CardGridSkeleton, ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard, EventRow } from "@/features/events/components/event-card";
import { RsvpButtons } from "@/features/events/components/rsvp-buttons";
import { getPendingRsvps, getUpcomingEvents } from "@/features/events/queries";
import { FriendFeed } from "@/features/feed/components/friend-feed";
import { getFriendFeed } from "@/features/feed/queries";
import { PlanCard } from "@/features/plans/components/plan-card";
import { getPlanInvitesPending, getPlans } from "@/features/plans/queries";
import { getCurrentProfile } from "@/features/profiles/queries";
import { requestNow } from "@/lib/dates";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("nav.home");

export default async function HomePage() {
  const [t, tCommon] = await Promise.all([getTranslations("home"), getTranslations("common")]);

  return (
    <div className="space-y-10">
      <div>
        <Suspense fallback={<Skeleton className="h-10 w-72" />}>
          <Greeting />
        </Suspense>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <Suspense fallback={<ListSkeleton count={2} />}>
        <PendingSection />
      </Suspense>

      <section>
        <SectionHeader title={t("upcoming")} href="/agenda" linkLabel={tCommon("seeAll")} />
        <Suspense fallback={<CardGridSkeleton />}>
          <UpcomingSection />
        </Suspense>
      </section>

      <section>
        <SectionHeader title={t("feed")} />
        <Suspense fallback={<ListSkeleton count={3} />}>
          <FeedSection />
        </Suspense>
      </section>

      <section>
        <SectionHeader title={t("ideas")} href="/plans" linkLabel={tCommon("seeAll")} />
        <Suspense fallback={<CardGridSkeleton />}>
          <IdeasSection />
        </Suspense>
      </section>
    </div>
  );
}

async function Greeting() {
  const [t, profile, now] = await Promise.all([
    getTranslations("home"),
    getCurrentProfile(),
    requestNow(),
  ]);
  // La hora en la zona del perfil, no la del servidor (en Vercel, UTC).
  const hour = new TZDate(now, profile.timezone).getHours();
  const key = hour < 13 ? "morning" : hour < 20 ? "afternoon" : "evening";
  return (
    <h1 className="text-3xl font-semibold md:text-4xl">
      {t(key, { name: profile.displayName.split(" ")[0] })}
    </h1>
  );
}

async function PendingSection() {
  const [t, events, plans] = await Promise.all([
    getTranslations("home"),
    getPendingRsvps(),
    getPlanInvitesPending(),
  ]);
  const count = events.length + plans.length;

  if (count === 0) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <PartyPopper aria-hidden className="size-4" /> {t("noPending")}
      </p>
    );
  }

  return (
    <section>
      <SectionHeader title={t("pending")} count={count} />
      <div className="space-y-4">
        {events.length > 0 && (
          <div className="bg-card divide-y overflow-hidden rounded-2xl border">
            {events.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                action={
                  <div className="hidden sm:block">
                    <RsvpButtons eventId={e.id} rsvp={e.myRsvp ?? "pending"} size="sm" />
                  </div>
                }
              />
            ))}
          </div>
        )}
        {plans.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

async function UpcomingSection() {
  const [t, tNav, events] = await Promise.all([
    getTranslations("home"),
    getTranslations("nav"),
    getUpcomingEvents(),
  ]);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title={t("noUpcoming")}
        description={t("noUpcomingHint")}
        action={
          <Button asChild>
            <Link href="/create">{tNav("create")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {events.slice(0, 6).map((e, i) => (
        <EventCard
          key={e.id}
          event={e}
          className="animate-rise"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}

async function FeedSection() {
  const [items, now] = await Promise.all([getFriendFeed(), requestNow()]);
  return <FriendFeed items={items} now={now} />;
}

async function IdeasSection() {
  const plans = (await getPlans("all")).filter((p) => p.myInterest !== "pending");
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {plans.slice(0, 3).map((p) => (
        <PlanCard key={p.id} plan={p} />
      ))}
    </div>
  );
}
