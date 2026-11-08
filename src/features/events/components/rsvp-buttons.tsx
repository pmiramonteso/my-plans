"use client";

import { useTranslations } from "next-intl";

import { ChoiceButtons } from "@/components/shared/choice-buttons";
import { setRsvp } from "@/features/events/actions";
import type { RsvpStatus } from "@/features/events/types";

export function RsvpButtons({
  eventId,
  rsvp,
  size,
}: {
  eventId: string;
  rsvp: RsvpStatus;
  size?: "default" | "sm";
}) {
  const t = useTranslations("events.rsvp");
  return (
    <ChoiceButtons
      value={rsvp === "going" ? "yes" : rsvp === "not_going" ? "no" : null}
      yesLabel={t("going")}
      noLabel={t("not_going")}
      onChoose={(choice) => setRsvp({ eventId, rsvp: choice === "yes" ? "going" : "not_going" })}
      size={size}
    />
  );
}
