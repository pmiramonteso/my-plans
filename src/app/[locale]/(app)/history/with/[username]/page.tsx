import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DemoNotice } from "@/components/shared/demo-notice";
import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getProfileByUsername } from "@/features/friends/queries";
import { HistoryView } from "@/features/history/components/history-view";
import { getHistory } from "@/features/history/queries";
import { getSharedStats } from "@/features/stats/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("history.title");

export default function SharedHistoryPage({
  params,
}: PageProps<"/[locale]/history/with/[username]">) {
  return (
    <>
      <DemoNotice />
      <Suspense fallback={<CardGridSkeleton count={6} />}>
        <SharedHistory params={params} />
      </Suspense>
    </>
  );
}

async function SharedHistory({
  params,
}: Pick<PageProps<"/[locale]/history/with/[username]">, "params">) {
  const { username } = await params;
  const [profile, t, tFriends] = await Promise.all([
    getProfileByUsername(username),
    getTranslations("history"),
    getTranslations("friends"),
  ]);
  if (!profile) notFound();
  const [stats, events] = await Promise.all([getSharedStats(username), getHistory(username)]);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <UserAvatar profile={profile} size="lg" />
            {t("with", { name: profile.displayName })}
          </span>
        }
        description={tFriends("sharedHistory")}
        backHref={`/u/${profile.username}`}
        backLabel={profile.displayName}
      />
      <HistoryView stats={stats} events={events} />
    </>
  );
}
