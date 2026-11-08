import { useTranslations } from "next-intl";

import { ChoiceButtons } from "@/components/shared/choice-buttons";
import type { PlanInterest } from "@/features/plans/types";

export function InterestButtons({
  interest,
  size,
}: {
  interest: PlanInterest;
  size?: "default" | "sm";
}) {
  const t = useTranslations("plans.interest");
  return (
    <ChoiceButtons
      value={interest === "interested" ? "yes" : interest === "not_interested" ? "no" : null}
      yesLabel={t("interested")}
      noLabel={t("not_interested")}
      size={size}
    />
  );
}
