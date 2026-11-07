import Link from "next/link";
import { ArrowRight, CalendarPlus, Lightbulb, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { pageTitle } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const generateMetadata = pageTitle("nav.create");

export default async function CreatePage() {
  const t = await getTranslations("create");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("title")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Choice
          href="/create/plan"
          icon={Lightbulb}
          title={t("plan")}
          description={t("planHint")}
          tone="bg-cat-sunrise/20 text-foreground"
        />
        <Choice
          href="/create/event"
          icon={CalendarPlus}
          title={t("event")}
          description={t("eventHint")}
          tone="bg-primary/12 text-primary"
        />
      </div>
    </div>
  );
}

function Choice({
  href,
  icon: Icon,
  title,
  description,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-card hover:border-primary/40 hover:shadow-foreground/5 focus-visible:ring-ring/50 flex flex-col gap-4 rounded-3xl border p-6 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-3 focus-visible:outline-none"
    >
      <span className={cn("flex size-14 items-center justify-center rounded-2xl", tone)}>
        <Icon aria-hidden className="size-7" strokeWidth={1.75} />
      </span>
      <span className="space-y-1">
        <span className="font-heading flex items-center gap-2 text-2xl font-semibold">
          {title}
          <ArrowRight
            aria-hidden
            className="text-muted-foreground group-hover:text-primary size-5 transition group-hover:translate-x-1"
          />
        </span>
        <span className="text-muted-foreground block text-sm">{description}</span>
      </span>
    </Link>
  );
}
