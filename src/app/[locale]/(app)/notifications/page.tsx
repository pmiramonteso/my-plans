import { Suspense } from "react";
import Link from "next/link";
import {
  BellOff,
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  Camera,
  Lightbulb,
  PartyPopper,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { DemoButton } from "@/components/shared/demo-button";
import { DemoNotice } from "@/components/shared/demo-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getNotifications } from "@/features/notifications/queries";
import type { NotificationType } from "@/features/notifications/types";
import { requestNow } from "@/lib/dates";
import { pageTitle } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const generateMetadata = pageTitle("notifications.title");

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  friend_request: UserPlus,
  friend_accepted: UserPlus,
  plan_invite: Lightbulb,
  plan_interest: Lightbulb,
  event_invite: CalendarClock,
  event_rsvp: CalendarCheck,
  event_updated: CalendarClock,
  event_cancelled: CalendarX2,
  event_completed: PartyPopper,
  photos_added: Camera,
};

export default async function NotificationsPage() {
  const t = await getTranslations("notifications");
  return (
    <div className="mx-auto max-w-3xl">
      <DemoNotice />
      <PageHeader
        title={t("title")}
        actions={
          <DemoButton variant="ghost" size="sm">
            {t("markAllRead")}
          </DemoButton>
        }
      />
      <Suspense fallback={<ListSkeleton count={6} />}>
        <NotificationList />
      </Suspense>
    </div>
  );
}

async function NotificationList() {
  const [t, format, notifications, now] = await Promise.all([
    getTranslations("notifications"),
    getFormatter(),
    getNotifications(),
    requestNow(),
  ]);
  if (notifications.length === 0) return <EmptyState icon={BellOff} title={t("empty")} />;

  return (
    <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
      {notifications.map((n) => {
        const Icon = TYPE_ICON[n.type];
        const unread = !n.readAt;
        return (
          <li key={n.id}>
            <Link
              href={n.href}
              className={cn(
                "hover:bg-secondary/50 flex items-start gap-3 p-4 transition-colors",
                unread && "bg-primary/5",
              )}
            >
              <span className="relative shrink-0">
                {n.actor ? (
                  <UserAvatar profile={n.actor} />
                ) : (
                  <span className="bg-secondary flex size-10 items-center justify-center rounded-full" />
                )}
                <span className="bg-card ring-card absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full ring-2">
                  <Icon aria-hidden className="text-primary size-3.5" />
                </span>
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block text-pretty">
                  {t.rich(`type.${n.type}`, {
                    actor: n.actor?.displayName ?? "",
                    title: n.data.title ?? "",
                    count: n.data.count ?? 0,
                    b: (chunks) => <strong className="font-semibold">{chunks}</strong>,
                  })}
                </span>
                <time dateTime={n.createdAt} className="text-muted-foreground text-xs">
                  {format.relativeTime(new Date(n.createdAt), now)}
                </time>
              </span>
              {unread && (
                <span className="bg-accent mt-1.5 size-2.5 shrink-0 rounded-full">
                  <span className="sr-only">{t("unread", { count: 1 })}</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
