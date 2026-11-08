import { useFormatter } from "next-intl";

import { cn } from "@/lib/utils";

// Bloque "14 / NOV" tipo calendario de papel.
export function DateBadge({
  date,
  timeZone,
  className,
}: {
  date: string;
  timeZone: string;
  className?: string;
}) {
  const format = useFormatter();
  const d = new Date(date);
  return (
    <div
      className={cn(
        "bg-card flex w-12 shrink-0 flex-col items-center overflow-hidden rounded-lg border text-center",
        className,
      )}
    >
      <span className="bg-accent text-accent-foreground w-full py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase">
        {format.dateTime(d, { month: "short", timeZone })}
      </span>
      <span className="font-heading py-1 text-xl leading-none font-semibold tabular-nums">
        {format.dateTime(d, { day: "numeric", timeZone })}
      </span>
    </div>
  );
}
