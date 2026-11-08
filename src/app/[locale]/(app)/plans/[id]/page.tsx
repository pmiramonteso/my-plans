import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalendarCheck, ExternalLink, Gauge, MapPin, MountainSnow } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CategoryBadge } from "@/components/shared/category";
import { Cover } from "@/components/shared/cover";
import { DetailHero, Fact, Panel, Prose } from "@/components/shared/detail";
import { DetailSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { InterestButtons } from "@/features/plans/components/interest-buttons";
import { PlanManage } from "@/features/plans/components/plan-manage";
import { getPlan } from "@/features/plans/queries";
import type { PlanInterest } from "@/features/plans/types";
import { pageTitle } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const generateMetadata = pageTitle("plans.title");

export default function PlanPage({ params }: PageProps<"/[locale]/plans/[id]">) {
  return (
    <>
      <Suspense fallback={<DetailSkeleton />}>
        <PlanDetail params={params} />
      </Suspense>
    </>
  );
}

const INTEREST_TONE: Record<PlanInterest, string> = {
  interested: "bg-primary/12 text-primary",
  pending: "bg-secondary text-muted-foreground",
  not_interested: "bg-secondary text-muted-foreground line-through decoration-1",
};

async function PlanDetail({ params }: Pick<PageProps<"/[locale]/plans/[id]">, "params">) {
  const { id } = await params;
  const [plan, t] = await Promise.all([getPlan(id), getTranslations("plans")]);
  if (!plan) notFound();

  const mine = plan.myInterest === null;

  return (
    <article>
      <DetailHero>
        <Cover src={plan.coverUrl} category={plan.category} iconClassName="size-16" />
      </DetailHero>

      <header className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={plan.category} />
          {plan.status === "scheduled" && (
            <Badge variant="secondary">
              <CalendarCheck /> {t("scheduled")}
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-semibold text-balance md:text-4xl">{plan.title}</h1>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <UserAvatar profile={plan.creator} size="xs" />
          {mine ? t("yours") : t("by", { name: plan.creator.displayName })}
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {/* Acción principal, arriba del todo en móvil. */}
          <Panel className="lg:hidden">
            <PlanAction id={plan.id} mine={mine} interest={plan.myInterest} />
          </Panel>

          {plan.description && (
            <Panel>
              <Prose text={plan.description} />
            </Panel>
          )}

          <Panel>
            <ul className="space-y-3 text-sm">
              {plan.locationName && (
                <Fact icon={MapPin}>
                  <span className="font-medium">{plan.locationName}</span>
                  {plan.address && (
                    <span className="text-muted-foreground block">{plan.address}</span>
                  )}
                </Fact>
              )}
              {plan.difficulty && (
                <Fact icon={Gauge}>
                  {t("difficulty")}:{" "}
                  <span className="font-medium">
                    {t("difficultyValue", { value: plan.difficulty })}
                  </span>
                </Fact>
              )}
              {plan.peaks.map((peak) => (
                <Fact key={peak.id} icon={MountainSnow}>
                  <span className="font-medium">{peak.name}</span> · {peak.altitudeM} m
                </Fact>
              ))}
              {plan.externalUrl && (
                <Fact icon={ExternalLink}>
                  <a
                    href={plan.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium break-all underline-offset-4 hover:underline"
                  >
                    {new URL(plan.externalUrl).hostname}
                  </a>
                </Fact>
              )}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel className="hidden lg:block">
            <PlanAction id={plan.id} mine={mine} interest={plan.myInterest} />
          </Panel>

          <Panel title={t("invitations")}>
            <ul className="space-y-3">
              {plan.invitations.map(({ profile, interest }) => (
                <li key={profile.id} className="flex items-center gap-3">
                  <UserAvatar profile={profile} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {profile.displayName}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      INTEREST_TONE[interest],
                    )}
                  >
                    {t(`interest.${interest}`)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </article>
  );
}

async function PlanAction({
  id,
  mine,
  interest,
}: {
  id: string;
  mine: boolean;
  interest: PlanInterest | null;
}) {
  const t = await getTranslations("plans");
  if (mine) return <PlanManage id={id} />;
  return (
    <div className="space-y-3">
      <p className="font-heading text-lg font-semibold">{t("interestQuestion")}</p>
      <InterestButtons planId={id} interest={interest ?? "pending"} />
    </div>
  );
}
