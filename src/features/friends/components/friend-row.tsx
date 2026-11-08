import Link from "next/link";

import { UserAvatar } from "@/components/shared/user-avatar";
import type { ProfileSummary } from "@/features/profiles/types";

export function FriendRow({
  profile,
  meta,
  action,
}: {
  profile: ProfileSummary;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-3 sm:p-4">
      <Link
        href={`/u/${profile.username}`}
        className="focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:outline-none"
      >
        <UserAvatar profile={profile} />
        <span className="min-w-0">
          <span className="block truncate font-medium">{profile.displayName}</span>
          <span className="text-muted-foreground block truncate text-sm">
            @{profile.username}
            {meta && <> · {meta}</>}
          </span>
        </span>
      </Link>
      {action}
    </div>
  );
}
