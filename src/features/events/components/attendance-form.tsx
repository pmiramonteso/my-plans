"use client";

import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import type { EventParticipant } from "@/features/events/types";

// Marca quién asistió de verdad. Los que confirmaron vienen preseleccionados.
// TODO(Fase 5): RPC complete_event(event, attendees[]).
export function AttendanceForm({ participants }: { participants: EventParticipant[] }) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        toast(tCommon("demoAction"));
      }}
    >
      <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
        {participants.map(({ profile, rsvp }) => (
          <li key={profile.id}>
            <label className="hover:bg-secondary/50 has-[:focus-visible]:bg-secondary/50 flex cursor-pointer items-center gap-3 p-4 transition-colors">
              <UserAvatar profile={profile} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{profile.displayName}</span>
                <span className="text-muted-foreground block text-xs">{t(`rsvp.${rsvp}`)}</span>
              </span>
              <input
                type="checkbox"
                name="attendees"
                value={profile.id}
                defaultChecked={rsvp === "going"}
                className="peer sr-only"
              />
              <span className="peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-ring/50 flex size-7 items-center justify-center rounded-full border-2 text-transparent transition peer-focus-visible:ring-3">
                <CircleCheck aria-hidden className="size-5" />
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          {t("completeSubmit")}
        </Button>
      </div>
    </form>
  );
}
