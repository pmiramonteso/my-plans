import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, SearchX, UserPlus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/shared/skeletons";
import { AvatarStack } from "@/components/shared/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FriendRow } from "@/features/friends/components/friend-row";
import { FriendshipButton } from "@/features/friends/components/friendship-button";
import { SearchBox } from "@/features/friends/components/search-box";
import { getFriendRequests, getFriends, searchProfiles } from "@/features/friends/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("friends.title");

export default async function FriendsPage({ searchParams }: PageProps<"/[locale]/friends">) {
  const t = await getTranslations("friends");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="mb-6">
        <Suspense fallback={<Skeleton className="h-12 rounded-full" />}>
          <SearchBox label={t("search")} />
        </Suspense>
      </div>
      <Suspense fallback={<ListSkeleton count={6} />}>
        <FriendsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FriendsContent({
  searchParams,
}: Pick<PageProps<"/[locale]/friends">, "searchParams">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  if (query.length >= 2) return <SearchResults query={query} />;
  return (
    <>
      <RequestsBanner />
      <FriendList />
    </>
  );
}

async function SearchResults({ query }: { query: string }) {
  const [t, results] = await Promise.all([getTranslations("friends"), searchProfiles(query)]);
  if (results.length === 0) return <EmptyState icon={SearchX} title={t("noResults")} />;
  return (
    <section>
      <SectionHeader title={t("results")} count={results.length} />
      <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
        {results.map(({ profile, state }) => (
          <li key={profile.id}>
            <FriendRow
              profile={profile}
              action={<FriendshipButton userId={profile.id} state={state} />}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

async function RequestsBanner() {
  const [t, requests] = await Promise.all([getTranslations("friends"), getFriendRequests()]);
  const incoming = requests.filter((r) => r.direction === "incoming");
  if (incoming.length === 0) return null;
  return (
    <Link
      href="/friends/requests"
      className="border-accent/40 bg-accent/10 hover:bg-accent/15 mb-6 flex items-center gap-3 rounded-2xl border p-4 transition"
    >
      <span className="bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
        <UserPlus aria-hidden className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{t("requests")}</span>
        <span className="text-muted-foreground block truncate text-sm">
          {incoming.map((r) => r.profile.displayName).join(", ")}
        </span>
      </span>
      <AvatarStack profiles={incoming.map((r) => r.profile)} max={3} />
      <ChevronRight aria-hidden className="text-muted-foreground size-5" />
    </Link>
  );
}

async function FriendList() {
  const [t, friends] = await Promise.all([getTranslations("friends"), getFriends()]);
  if (friends.length === 0) {
    return <EmptyState icon={Users} title={t("empty")} description={t("emptyHint")} />;
  }
  return (
    <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
      {friends.map((f) => (
        <li key={f.id}>
          <FriendRow profile={f} meta={t("shared", { count: f.sharedCount })} />
        </li>
      ))}
    </ul>
  );
}
