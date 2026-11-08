"use client";

import { useState, useTransition } from "react";
import { CircleCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { completeEvent } from "@/features/events/actions";
import type { EventParticipant } from "@/features/events/types";
import { reportActionError } from "@/lib/form";

// Marca quién asistió de verdad. Los que confirmaron vienen preseleccionados.
// Al confirmar, complete_event cierra el evento y el action vuelve al detalle.
export function AttendanceForm({
  eventId,
  participants,
}: {
  eventId: string;
  participants: EventParticipant[];
}) {
  const t = useTranslations();
  const [attendees, setAttendees] = useState(
    () =>
      new Set(
        participants
          .filter((p) => p.rsvp === "going" || p.role === "host")
          .map((p) => p.profile.id),
      ),
  );
  const [pending, startTransition] = useTransition();

  const toggle = (id: string, checked: boolean) =>
    setAttendees((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await completeEvent({ id: eventId, attendees: [...attendees] });
          if (!result.ok) reportActionError(result, t);
        });
      }}
    >
      <fieldset disabled={pending} className="contents">
        <legend className="sr-only">{t("events.completeTitle")}</legend>
        <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
          {participants.map(({ profile, rsvp }) => (
            <li key={profile.id}>
              <label className="hover:bg-secondary/50 has-[:focus-visible]:bg-secondary/50 flex cursor-pointer items-center gap-3 p-4 transition-colors">
                <UserAvatar profile={profile} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{profile.displayName}</span>
                  <span className="text-muted-foreground block text-xs">
                    {t(`events.rsvp.${rsvp}`)}
                  </span>
                </span>
                <input
                  type="checkbox"
                  name="attendees"
                  value={profile.id}
                  checked={attendees.has(profile.id)}
                  onChange={(e) => toggle(profile.id, e.target.checked)}
                  className="peer sr-only"
                />
                <span className="peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-ring/50 flex size-7 items-center justify-center rounded-full border-2 text-transparent transition peer-focus-visible:ring-3">
                  <CircleCheck aria-hidden className="size-5" />
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {attendees.size === 0
            ? t("validation.attendeesRequired")
            : t("events.attendeesCount", { count: attendees.size })}
        </p>
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={pending || attendees.size === 0}
        >
          {pending && <Loader2 className="animate-spin" />}
          {t("events.completeSubmit")}
        </Button>
      </div>
    </form>
  );
}
