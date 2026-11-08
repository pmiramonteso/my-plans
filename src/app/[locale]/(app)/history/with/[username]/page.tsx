import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getFriendshipWith } from "@/features/friends/queries";
import { HistoryView } from "@/features/history/components/history-view";
import { parseHistoryFilter } from "@/features/history/filters";
import { getHistory } from "@/features/history/queries";
import { getProfileByUsername } from "@/features/profiles/queries";
import { getSharedStats } from "@/features/stats/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("history.title");

type Props = PageProps<"/[locale]/history/with/[username]">;

export default function SharedHistoryPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<CardGridSkeleton count={6} />}>
      <SharedHistory params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SharedHistory({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const filter = parseHistoryFilter(query);
  const [profile, t, tFriends] = await Promise.all([
    getProfileByUsername(username),
    getTranslations("history"),
    getTranslations("friends"),
  ]);
  // Solo entre amigos (get_shared_stats lo exige también en la BD).
  if (!profile || (await getFriendshipWith(profile.id)) !== "friends") notFound();
  const [stats, history] = await Promise.all([
    getSharedStats(profile, filter.year),
    getHistory(filter, profile),
  ]);

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
      <HistoryView stats={stats} history={history} filter={filter} />
    </>
  );
}
