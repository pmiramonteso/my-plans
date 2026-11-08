"use client";

import { useOptimistic, useTransition } from "react";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ActionResult } from "@/lib/action";
import { reportActionError } from "@/lib/form";
import { cn } from "@/lib/utils";

type Choice = "yes" | "no";

// Respuesta sí/no (RSVP de un evento o interés en una propuesta). Se marca al
// instante y el action refresca la página con el valor guardado.
export function ChoiceButtons({
  value,
  yesLabel,
  noLabel,
  onChoose,
  size = "default",
}: {
  value: Choice | null;
  yesLabel: string;
  noLabel: string;
  onChoose: (choice: Choice) => Promise<ActionResult<unknown>>;
  size?: "default" | "sm";
}) {
  const t = useTranslations();
  const [current, setCurrent] = useOptimistic(value);
  const [pending, startTransition] = useTransition();

  const choose = (next: Choice) => {
    if (next === current) return;
    startTransition(async () => {
      setCurrent(next);
      const result = await onChoose(next);
      if (!result.ok) reportActionError(result, t);
    });
  };

  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-full border font-medium transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-70";
  const sizing = size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";

  return (
    <div className="flex gap-2" role="group" aria-busy={pending}>
      <button
        type="button"
        aria-pressed={current === "yes"}
        disabled={pending}
        onClick={() => choose("yes")}
        className={cn(
          base,
          sizing,
          current === "yes"
            ? "border-primary bg-primary text-primary-foreground"
            : "bg-card hover:border-primary hover:text-primary",
        )}
      >
        <Check aria-hidden className="size-4" />
        {yesLabel}
      </button>
      <button
        type="button"
        aria-pressed={current === "no"}
        disabled={pending}
        onClick={() => choose("no")}
        className={cn(
          base,
          sizing,
          current === "no"
            ? "border-foreground/30 bg-secondary text-foreground"
            : "bg-card text-muted-foreground hover:text-foreground",
        )}
      >
        <X aria-hidden className="size-4" />
        {noLabel}
      </button>
    </div>
  );
}
