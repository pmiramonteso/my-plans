"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

// Respuesta sí/no (RSVP de un evento o interés en una propuesta).
// TODO(Fase 4): llamar al Server Action correspondiente.
export function ChoiceButtons({
  value,
  yesLabel,
  noLabel,
  size = "default",
}: {
  value: "yes" | "no" | null;
  yesLabel: string;
  noLabel: string;
  size?: "default" | "sm";
}) {
  const t = useTranslations("common");
  const [current, setCurrent] = useState(value);

  const choose = (next: "yes" | "no") => {
    setCurrent(next);
    toast(t("demoAction"));
  };

  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-full border font-medium transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";
  const sizing = size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";

  return (
    <div className="flex gap-2" role="group">
      <button
        type="button"
        aria-pressed={current === "yes"}
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
