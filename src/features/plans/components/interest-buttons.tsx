"use client";

import { useTranslations } from "next-intl";

import { ChoiceButtons } from "@/components/shared/choice-buttons";
import { setPlanInterest } from "@/features/plans/actions";
import type { PlanInterest } from "@/features/plans/types";

export function InterestButtons({
  planId,
  interest,
  size,
}: {
  planId: string;
  interest: PlanInterest;
  size?: "default" | "sm";
}) {
  const t = useTranslations("plans.interest");
  return (
    <ChoiceButtons
      value={interest === "interested" ? "yes" : interest === "not_interested" ? "no" : null}
      yesLabel={t("interested")}
      noLabel={t("not_interested")}
      onChoose={(choice) =>
        setPlanInterest({ planId, interest: choice === "yes" ? "interested" : "not_interested" })
      }
      size={size}
    />
  );
}
