import Link from "next/link";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { CategoryBadge } from "@/components/shared/category";
import { Cover } from "@/components/shared/cover";
import { AvatarStack, UserAvatar } from "@/components/shared/user-avatar";
import type { PlanSummary } from "@/features/plans/types";
import { cn } from "@/lib/utils";

import { InterestButtons } from "./interest-buttons";

export function PlanCard({ plan, className }: { plan: PlanSummary; className?: string }) {
  const t = useTranslations("plans");
  const mine = plan.myInterest === null;

  return (
    <article
      className={cn(
        "group bg-card hover:shadow-foreground/5 relative flex flex-col overflow-hidden rounded-2xl border transition hover:shadow-lg",
        className,
      )}
    >
      <Cover src={plan.coverUrl} category={plan.category} className="aspect-[2/1] w-full" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1.5">
          <CategoryBadge category={plan.category} />
          <h3 className="text-lg leading-snug font-semibold text-balance">
            {/* El enlace cubre toda la tarjeta salvo los botones de respuesta. */}
            <Link
              href={`/plans/${plan.id}`}
              className="focus-visible:after:ring-ring/50 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:ring-3"
            >
              {plan.title}
            </Link>
          </h3>
          {plan.locationName && (
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <MapPin aria-hidden className="size-3.5" />
              {plan.locationName}
            </p>
          )}
        </div>

        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <UserAvatar profile={plan.creator} size="xs" />
          <span className="truncate">
            {mine
              ? t("invited", { count: plan.invitedCount })
              : t("by", { name: plan.creator.displayName })}
          </span>
        </div>

        <div className="mt-auto space-y-3 border-t pt-3">
          <div className="flex items-center gap-2">
            <AvatarStack profiles={plan.interested} max={3} size="xs" />
            <span className="text-muted-foreground text-xs">
              {t("interested", { count: plan.interested.length })}
            </span>
          </div>
          {!mine && (
            <div className="relative z-10">
              <InterestButtons interest={plan.myInterest ?? "pending"} size="sm" />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
