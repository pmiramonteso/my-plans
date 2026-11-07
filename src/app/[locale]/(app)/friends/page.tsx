import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Search, UserPlus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { DemoNotice } from "@/components/shared/demo-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/shared/skeletons";
import { AvatarStack } from "@/components/shared/user-avatar";
import { Input } from "@/components/ui/input";
import { FriendRow } from "@/features/friends/components/friend-row";
import { getFriendRequests, getFriends } from "@/features/friends/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("friends.title");

export default async function FriendsPage() {
  const t = await getTranslations("friends");
  return (
    <div className="mx-auto max-w-3xl">
      <DemoNotice />
      <PageHeader title={t("title")} description={t("subtitle")} />

      {/* TODO(Fase 3): búsqueda (trigram) con resultados en vivo. */}
      <form role="search" className="relative mb-6">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          name="q"
          aria-label={t("search")}
          placeholder={t("search")}
          className="bg-card h-12 rounded-full pl-10"
        />
      </form>

      <Suspense fallback={<ListSkeleton count={1} />}>
        <RequestsBanner />
      </Suspense>

      <Suspense fallback={<ListSkeleton count={6} />}>
        <FriendList />
      </Suspense>
    </div>
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
      <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-full">
        <UserPlus aria-hidden className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{t("requests")}</span>
        <span className="text-muted-foreground block text-sm">
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
