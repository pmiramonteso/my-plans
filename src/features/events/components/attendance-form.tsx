"use client";

import { useState, useTransition } from "react";
import { CircleCheck, Loader2, MountainSnow } from "lucide-react";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeEvent } from "@/features/events/actions";
import type { EventDetail, EventParticipant } from "@/features/events/types";
import { reportActionError } from "@/lib/form";

// Marca quién asistió de verdad. Los que confirmaron vienen preseleccionados.
// Al confirmar, complete_event cierra el evento y el action vuelve al detalle.
export function AttendanceForm({
  eventId,
  participants,
  peaks,
}: {
  eventId: string;
  participants: EventParticipant[];
  peaks: EventDetail["peaks"];
}) {
  const t = useTranslations();
  // Desnivel y km por cima (texto de los inputs; "" = sin dato).
  const [ascents, setAscents] = useState(() =>
    peaks.map((p) => ({
      id: p.id,
      name: p.name,
      elevationGainM: p.elevationGainM?.toString() ?? "",
      distanceKm: p.distanceKm?.toString() ?? "",
    })),
  );
  const setAscent = (id: string, patch: Partial<(typeof ascents)[number]>) =>
    setAscents((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
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
          const result = await completeEvent({
            id: eventId,
            attendees: [...attendees],
            ascents: ascents.map(({ id, elevationGainM, distanceKm }) => ({
              id,
              elevationGainM,
              distanceKm,
            })),
          });
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
        {ascents.length > 0 && (
          <section className="mt-6 space-y-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">{t("peaks.ascentTitle")}</h2>
              <p className="text-muted-foreground text-sm">{t("peaks.ascentHint")}</p>
            </div>
            <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
              {ascents.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 p-4">
                  <MountainSnow aria-hidden className="text-cat-granite size-5 shrink-0" />
                  <span className="min-w-0 flex-1 font-medium">{a.name}</span>
                  <span className="flex gap-2">
                    <Input
                      inputMode="numeric"
                      className="w-28"
                      placeholder={t("peaks.elevationShort")}
                      aria-label={`${t("peaks.elevation")} · ${a.name}`}
                      value={a.elevationGainM}
                      onChange={(e) => setAscent(a.id, { elevationGainM: e.target.value })}
                    />
                    <Input
                      inputMode="decimal"
                      className="w-24"
                      placeholder={t("peaks.distanceShort")}
                      aria-label={`${t("peaks.distance")} · ${a.name}`}
                      value={a.distanceKm}
                      onChange={(e) => setAscent(a.id, { distanceKm: e.target.value })}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
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
