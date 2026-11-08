import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      <span className="bg-secondary text-primary flex size-12 items-center justify-center rounded-full">
        <Icon aria-hidden className="size-6" strokeWidth={1.75} />
      </span>
      <div className="space-y-1">
        <p className="font-heading text-lg font-semibold">{title}</p>
        {description && (
          <p className="text-muted-foreground mx-auto max-w-xs text-sm">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
