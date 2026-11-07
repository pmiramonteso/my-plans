import { Suspense } from "react";
import { Inbox } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/shared/skeletons";
import { FriendRow } from "@/features/friends/components/friend-row";
import { FriendshipButton } from "@/features/friends/components/friendship-button";
import { getFriendRequests } from "@/features/friends/queries";
import type { FriendRequest } from "@/features/friends/types";
import { requestNow } from "@/lib/dates";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("friends.requests");

export default async function RequestsPage() {
  const [t, tNav] = await Promise.all([getTranslations("friends"), getTranslations("nav")]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("requests")} backHref="/friends" backLabel={tNav("friends")} />
      <Suspense fallback={<ListSkeleton count={3} />}>
        <Requests />
      </Suspense>
    </div>
  );
}

async function Requests() {
  const [t, format, requests, now] = await Promise.all([
    getTranslations("friends"),
    getFormatter(),
    getFriendRequests(),
    requestNow(),
  ]);
  if (requests.length === 0) return <EmptyState icon={Inbox} title={t("noRequests")} />;

  const when = (r: FriendRequest) => format.relativeTime(new Date(r.createdAt), now);
  const incoming = requests.filter((r) => r.direction === "incoming");
  const outgoing = requests.filter((r) => r.direction === "outgoing");

  return (
    <div className="space-y-8">
      {incoming.length > 0 && (
        <section>
          <SectionHeader title={t("incoming")} count={incoming.length} />
          <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
            {incoming.map((r) => (
              <li key={r.profile.id}>
                <FriendRow
                  profile={r.profile}
                  meta={when(r)}
                  action={<FriendshipButton userId={r.profile.id} state="incoming" />}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      {outgoing.length > 0 && (
        <section>
          <SectionHeader title={t("outgoing")} count={outgoing.length} />
          <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
            {outgoing.map((r) => (
              <li key={r.profile.id}>
                <FriendRow
                  profile={r.profile}
                  meta={when(r)}
                  action={<FriendshipButton userId={r.profile.id} state="outgoing" />}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
