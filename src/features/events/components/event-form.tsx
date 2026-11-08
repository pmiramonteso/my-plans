"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  CategoryPicker,
  CoverPicker,
  Field,
  FormSection,
  FriendPicker,
  VisibilityPicker,
} from "@/components/shared/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createEvent, setEventCover, updateEvent } from "@/features/events/actions";
import {
  eventFormSchema,
  type EventFormOutput,
  type EventFormValues,
} from "@/features/events/schemas";
import type { ProfileSummary } from "@/features/profiles/types";
import { fieldMessage, reportActionError } from "@/lib/form";
import { attachCover } from "@/lib/upload-cover";

const EMPTY: Partial<EventFormValues> = {
  title: "",
  description: "",
  extraInfo: "",
  location: "",
  link: "",
  date: "",
  allDay: false,
  startTime: "",
  endTime: "",
  endDate: "",
  visibility: "invited",
  invitees: [],
};

// Tres usos: crear, organizar una propuesta (planId, prerrellenado con los
// interesados marcados) y editar (eventId; `friends` = los aún no invitados).
export function EventForm({
  friends,
  defaults,
  timezone,
  planId,
  eventId,
  coverUrl,
}: {
  friends: ProfileSummary[];
  defaults?: Partial<EventFormValues>;
  timezone: string;
  planId?: string;
  eventId?: string;
  coverUrl?: string | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cover, setCover] = useState<File | null>(null);
  const form = useForm<EventFormValues, unknown, EventFormOutput>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: { ...EMPTY, timezone, ...defaults },
  });
  const { errors } = form.formState;
  const allDay = useWatch({ control: form.control, name: "allDay" });
  const msg = (m?: string) => fieldMessage(t, m);

  // El action recibe los valores del formulario tal cual y los valida de nuevo.
  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const values = form.getValues();
      const result = eventId
        ? await updateEvent({ ...values, id: eventId })
        : await createEvent({ ...values, planId });
      if (!result.ok) return reportActionError(result, t, form.setError);

      const id = result.data.id;
      if (cover && !(await attachCover("events", id, cover, setEventCover))) {
        toast.error(t("create.coverError"));
      }
      router.push(`/events/${id}`);
    }),
  );

  const text = (name: "title" | "location" | "link") => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": `${name}-message`,
    ...form.register(name),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormSection>
        <Field label={t("create.fields.title")} htmlFor="title" error={msg(errors.title?.message)}>
          <Input
            id="title"
            maxLength={120}
            placeholder={t("create.fields.titlePlaceholder")}
            {...text("title")}
          />
        </Field>
        <Field label={t("categories.label")} error={msg(errors.category?.message)}>
          <CategoryPicker field={form.register("category")} />
        </Field>
      </FormSection>

      <FormSection>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={t("create.fields.date")} htmlFor="date" error={msg(errors.date?.message)}>
            <Input
              id="date"
              type="date"
              aria-invalid={Boolean(errors.date)}
              aria-describedby="date-message"
              {...form.register("date")}
            />
          </Field>
          {allDay ? (
            <Field
              label={t("create.fields.endDate")}
              htmlFor="endDate"
              optional
              error={msg(errors.endDate?.message)}
            >
              <Input
                id="endDate"
                type="date"
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby="endDate-message"
                {...form.register("endDate")}
              />
            </Field>
          ) : (
            <>
              <Field
                label={t("create.fields.startTime")}
                htmlFor="startTime"
                error={msg(errors.startTime?.message)}
              >
                <Input
                  id="startTime"
                  type="time"
                  aria-invalid={Boolean(errors.startTime)}
                  aria-describedby="startTime-message"
                  {...form.register("startTime")}
                />
              </Field>
              <Field
                label={t("create.fields.endTime")}
                htmlFor="endTime"
                optional
                error={msg(errors.endTime?.message)}
              >
                <Input id="endTime" type="time" {...form.register("endTime")} />
              </Field>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Controller
            control={form.control}
            name="allDay"
            render={({ field }) => (
              <Switch id="allDay" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label htmlFor="allDay">{t("create.fields.allDay")}</Label>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t("create.fields.location")}
            htmlFor="location"
            optional
            error={msg(errors.location?.message)}
          >
            <Input
              id="location"
              placeholder={t("create.fields.locationPlaceholder")}
              {...text("location")}
            />
          </Field>
          <Field
            label={t("create.fields.link")}
            htmlFor="link"
            optional
            error={msg(errors.link?.message)}
          >
            <Input
              id="link"
              type="url"
              inputMode="url"
              placeholder={t("create.fields.linkPlaceholder")}
              {...text("link")}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection>
        <Field
          label={t("create.fields.description")}
          htmlFor="description"
          optional
          error={msg(errors.description?.message)}
        >
          <Textarea
            id="description"
            rows={4}
            maxLength={5000}
            placeholder={t("create.fields.descriptionPlaceholder")}
            {...form.register("description")}
          />
        </Field>
        <Field
          label={t("create.fields.extraInfo")}
          htmlFor="extraInfo"
          optional
          error={msg(errors.extraInfo?.message)}
        >
          <Textarea
            id="extraInfo"
            rows={2}
            maxLength={5000}
            placeholder={t("create.fields.extraInfoPlaceholder")}
            {...form.register("extraInfo")}
          />
        </Field>
        <Field label={t("create.fields.cover")} optional>
          <CoverPicker file={cover} onChange={setCover} currentUrl={coverUrl} />
        </Field>
      </FormSection>

      <FormSection>
        <Field label={t("visibility.label")}>
          <VisibilityPicker field={form.register("visibility")} options={["invited", "friends"]} />
        </Field>
        {friends.length > 0 && (
          <Field
            label={t(eventId ? "create.fields.inviteMore" : "create.fields.invite")}
            hint={t("create.fields.inviteHint")}
            error={msg(errors.invitees?.message)}
          >
            <FriendPicker friends={friends} field={form.register("invitees")} />
          </Field>
        )}
      </FormSection>

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {eventId ? t("common.save") : t("create.submitEvent")}
        </Button>
      </div>
    </form>
  );
}
