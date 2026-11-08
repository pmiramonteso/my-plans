"use client";

import Link from "next/link";
import { CircleCheck, Pencil, Trash2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmAction } from "@/components/shared/confirm-action";
import { Button } from "@/components/ui/button";
import { cancelEvent, deleteEvent } from "@/features/events/actions";
import type { EventStatus } from "@/features/events/types";

// Acciones del organizador en el detalle del evento. Un evento cancelado solo
// se puede eliminar; uno ya empezado se puede marcar como realizado.
export function EventManage({
  id,
  status,
  started,
}: {
  id: string;
  status: EventStatus;
  started: boolean;
}) {
  const t = useTranslations("events");

  const remove = (
    <ConfirmAction
      trigger={
        <Button variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 data-icon="inline-start" />
          {t("delete")}
        </Button>
      }
      title={t("deleteTitle")}
      description={t("deleteHint")}
      confirmLabel={t("delete")}
      action={() => deleteEvent({ id })}
    />
  );

  if (status !== "scheduled") return remove;

  return (
    <div className="flex flex-col gap-2">
      {started && (
        <Button asChild size="lg">
          <Link href={`/events/${id}/complete`}>
            <CircleCheck data-icon="inline-start" />
            {t("complete")}
          </Link>
        </Button>
      )}
      <Button asChild variant={started ? "outline" : "default"} size={started ? "default" : "lg"}>
        <Link href={`/events/${id}/edit`}>
          <Pencil data-icon="inline-start" />
          {t("edit")}
        </Link>
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <ConfirmAction
          trigger={
            <Button variant="ghost">
              <XCircle data-icon="inline-start" />
              {t("cancelShort")}
            </Button>
          }
          title={t("cancelTitle")}
          description={t("cancelHint")}
          confirmLabel={t("cancelEvent")}
          action={() => cancelEvent({ id })}
        />
        {remove}
      </div>
    </div>
  );
}
