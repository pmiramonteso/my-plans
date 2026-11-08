"use client";

import Link from "next/link";
import { CalendarCheck, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmAction } from "@/components/shared/confirm-action";
import { Button } from "@/components/ui/button";
import { deletePlan } from "@/features/plans/actions";

// Acciones del creador en el detalle de la propuesta.
export function PlanManage({ id }: { id: string }) {
  const t = useTranslations("plans");
  return (
    <div className="flex flex-col gap-2">
      <Button asChild size="lg">
        <Link href={`/plans/${id}/schedule`}>
          <CalendarCheck data-icon="inline-start" />
          {t("schedule")}
        </Link>
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline">
          <Link href={`/plans/${id}/edit`}>
            <Pencil data-icon="inline-start" />
            {t("editShort")}
          </Link>
        </Button>
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
          action={() => deletePlan({ id })}
        />
      </div>
    </div>
  );
}
