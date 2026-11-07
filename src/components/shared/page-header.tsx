import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-col gap-3 md:mb-8", className)}>
      {backHref && (
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2 w-fit">
          <Link href={backHref}>
            <ArrowLeft data-icon="inline-start" />
            {backLabel}
          </Link>
        </Button>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-3xl font-semibold text-balance md:text-4xl">{title}</h1>
          {description && <p className="text-muted-foreground max-w-prose">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionHeader({
  title,
  href,
  linkLabel,
  count,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="flex items-baseline gap-2 text-xl font-semibold">
        {title}
        {count !== undefined && count > 0 && (
          <span className="text-muted-foreground font-sans text-sm font-medium tabular-nums">
            {count}
          </span>
        )}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
