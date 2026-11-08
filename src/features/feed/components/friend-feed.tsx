import Link from "next/link";
import { Users } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Cover } from "@/components/shared/cover";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { FeedItem } from "@/features/feed/queries";

// Actividad reciente de mis amigos (eventos realizados, propuestas, fotos).
export function FriendFeed({ items, now }: { items: FeedItem[]; now: Date }) {
  const t = useTranslations("feed");
  const format = useFormatter();

  if (items.length === 0) {
    return <EmptyState icon={Users} title={t("empty")} description={t("emptyHint")} />;
  }

  return (
    <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="hover:bg-secondary/50 flex items-center gap-3 p-3 transition-colors sm:p-4"
          >
            <UserAvatar profile={item.actor} />
            <span className="min-w-0 flex-1 text-sm">
              <span className="line-clamp-2 text-pretty">
                {t.rich(`kind.${item.kind}`, {
                  actor: item.actor.displayName,
                  title: item.title,
                  count: item.count ?? 0,
                  b: (chunks) => <strong className="font-semibold">{chunks}</strong>,
                })}
              </span>
              <time dateTime={item.occurredAt} className="text-muted-foreground text-xs">
                {format.relativeTime(new Date(item.occurredAt), now)}
              </time>
            </span>
            <Cover
              src={item.coverUrl}
              category={item.category}
              className="size-12 shrink-0 rounded-lg sm:size-14"
              iconClassName="size-5"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
