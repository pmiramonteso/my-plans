import { useTranslations } from "next-intl";

import { ChoiceButtons } from "@/components/shared/choice-buttons";
import type { RsvpStatus } from "@/features/events/types";

export function RsvpButtons({ rsvp, size }: { rsvp: RsvpStatus; size?: "default" | "sm" }) {
  const t = useTranslations("events.rsvp");
  return (
    <ChoiceButtons
      value={rsvp === "going" ? "yes" : rsvp === "not_going" ? "no" : null}
      yesLabel={t("going")}
      noLabel={t("not_going")}
      size={size}
    />
  );
}
