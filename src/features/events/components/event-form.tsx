"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  CategoryPicker,
  CoverDropzone,
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
import type { CategorySlug } from "@/features/categories/config";
import type { Visibility } from "@/features/plans/types";
import type { ProfileSummary } from "@/features/profiles/types";

export type EventFormDefaults = {
  title?: string;
  category?: CategorySlug;
  description?: string | null;
  location?: string | null;
  link?: string | null;
  date?: string; // yyyy-MM-dd
  startTime?: string; // HH:mm
  endTime?: string;
  allDay?: boolean;
  extraInfo?: string | null;
  visibility?: Visibility;
  invitees?: string[];
};

// Sirve para crear, organizar una propuesta (prerrellenado) y editar.
// TODO(Fase 4): React Hook Form + esquema Zod compartido con la RPC create_event.
export function EventForm({
  friends,
  defaults = {},
  submitLabel,
  showInvite = true,
}: {
  friends: ProfileSummary[];
  defaults?: EventFormDefaults;
  submitLabel: string;
  showInvite?: boolean;
}) {
  const t = useTranslations("create.fields");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const tVisibility = useTranslations("visibility");
  const [allDay, setAllDay] = useState(defaults.allDay ?? false);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        toast(tCommon("demoAction"));
      }}
    >
      <FormSection>
        <Field label={t("title")} htmlFor="title">
          <Input
            id="title"
            name="title"
            required
            maxLength={120}
            defaultValue={defaults.title}
            placeholder={t("titlePlaceholder")}
          />
        </Field>
        <Field label={tCategories("label")}>
          <CategoryPicker defaultValue={defaults.category} />
        </Field>
      </FormSection>

      <FormSection>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={t("date")} htmlFor="date">
            <Input id="date" name="date" type="date" required defaultValue={defaults.date} />
          </Field>
          {!allDay && (
            <>
              <Field label={t("startTime")} htmlFor="startTime">
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  required
                  defaultValue={defaults.startTime}
                />
              </Field>
              <Field label={t("endTime")} htmlFor="endTime" optional>
                <Input id="endTime" name="endTime" type="time" defaultValue={defaults.endTime} />
              </Field>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Switch id="allDay" name="allDay" checked={allDay} onCheckedChange={setAllDay} />
          <Label htmlFor="allDay">{t("allDay")}</Label>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("location")} htmlFor="location" optional>
            <Input
              id="location"
              name="location"
              defaultValue={defaults.location ?? undefined}
              placeholder={t("locationPlaceholder")}
            />
          </Field>
          <Field label={t("link")} htmlFor="link" optional>
            <Input
              id="link"
              name="link"
              type="url"
              defaultValue={defaults.link ?? undefined}
              placeholder={t("linkPlaceholder")}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection>
        <Field label={t("description")} htmlFor="description" optional>
          <Textarea
            id="description"
            name="description"
            rows={4}
            maxLength={5000}
            defaultValue={defaults.description ?? undefined}
            placeholder={t("descriptionPlaceholder")}
          />
        </Field>
        <Field label={t("extraInfo")} htmlFor="extraInfo" optional>
          <Textarea
            id="extraInfo"
            name="extraInfo"
            rows={2}
            defaultValue={defaults.extraInfo ?? undefined}
            placeholder={t("extraInfoPlaceholder")}
          />
        </Field>
        <Field label={t("cover")} optional>
          <CoverDropzone />
        </Field>
      </FormSection>

      {showInvite && (
        <FormSection>
          <Field label={tVisibility("label")}>
            <VisibilityPicker
              options={["invited", "friends"]}
              defaultValue={defaults.visibility ?? "invited"}
            />
          </Field>
          <Field label={t("invite")} hint={t("inviteHint")}>
            <FriendPicker friends={friends} defaultSelected={defaults.invitees} />
          </Field>
        </FormSection>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
