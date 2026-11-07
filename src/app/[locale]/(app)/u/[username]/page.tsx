import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { History, Lock, Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/page-header";
import { DetailSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { FriendshipButton } from "@/features/friends/components/friendship-button";
import { getFriendshipWith } from "@/features/friends/queries";
import { getCurrentProfile, getProfileByUsername } from "@/features/profiles/queries";
import { StatGrid } from "@/features/stats/components/stat-grid";
import { getMyStats, getSharedStats } from "@/features/stats/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("nav.profile");

export default function ProfilePage({ params }: PageProps<"/[locale]/u/[username]">) {
  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={<DetailSkeleton />}>
        <Profile params={params} />
      </Suspense>
    </div>
  );
}

async function Profile({ params }: Pick<PageProps<"/[locale]/u/[username]">, "params">) {
  const { username } = await params;
  const [profile, me, t, tNav, tCommon] = await Promise.all([
    getProfileByUsername(username),
    getCurrentProfile(),
    getTranslations("friends"),
    getTranslations("nav"),
    getTranslations("common"),
  ]);
  if (!profile) notFound();

  const isMe = profile.id === me.id;
  const friendship = isMe ? "none" : await getFriendshipWith(profile.id);
  // Las estadísticas compartidas solo existen entre amigos (la RPC lo exige).
  const stats = isMe
    ? await getMyStats()
    : friendship === "friends"
      ? await getSharedStats(profile)
      : null;

  return (
    <>
      <header className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
        <UserAvatar profile={profile} size="xl" className="ring-card ring-4" />
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-3xl font-semibold md:text-4xl">{profile.displayName}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="pt-1 text-pretty">{profile.bio}</p>}
        </div>
        {isMe ? (
          <Button asChild variant="outline">
            <Link href="/settings">
              <Pencil data-icon="inline-start" />
              {tCommon("edit")}
            </Link>
          </Button>
        ) : (
          <FriendshipButton userId={profile.id} state={friendship} size="default" />
        )}
      </header>

      {stats ? (
        <section className="space-y-4">
          <SectionHeader
            title={isMe ? tNav("history") : t("sharedHistory")}
            href={isMe ? "/history" : `/history/with/${profile.username}`}
            linkLabel={isMe ? tCommon("seeAll") : t("viewSharedHistory")}
          />
          <StatGrid stats={stats} />
          {!isMe && (
            <Button asChild variant="outline" className="w-full sm:hidden">
              <Link href={`/history/with/${profile.username}`}>
                <History data-icon="inline-start" />
                {t("viewSharedHistory")}
              </Link>
            </Button>
          )}
        </section>
      ) : (
        <EmptyState icon={Lock} title={t("notFriendsYet")} description={t("notFriendsHint")} />
      )}
    </>
  );
}
