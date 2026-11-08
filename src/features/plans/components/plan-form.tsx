"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  CategoryPicker,
  CoverDropzone,
  DifficultyPicker,
  Field,
  FormSection,
  FriendPicker,
  VisibilityPicker,
} from "@/components/shared/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileSummary } from "@/features/profiles/types";

// TODO(Fase 4): React Hook Form + esquema Zod compartido con el Server Action.
export function PlanForm({ friends }: { friends: ProfileSummary[] }) {
  const t = useTranslations("create");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const tVisibility = useTranslations("visibility");

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        toast(tCommon("demoAction"));
      }}
    >
      <FormSection>
        <Field label={t("fields.title")} htmlFor="title">
          <Input
            id="title"
            name="title"
            required
            maxLength={120}
            placeholder={t("fields.titlePlaceholder")}
          />
        </Field>
        <Field label={tCategories("label")}>
          <CategoryPicker />
        </Field>
        <Field label={t("fields.description")} htmlFor="description" optional>
          <Textarea
            id="description"
            name="description"
            rows={4}
            maxLength={5000}
            placeholder={t("fields.descriptionPlaceholder")}
          />
        </Field>
      </FormSection>

      <FormSection>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("fields.location")} htmlFor="location" optional>
            <Input id="location" name="location" placeholder={t("fields.locationPlaceholder")} />
          </Field>
          <Field label={t("fields.link")} htmlFor="link" optional>
            <Input id="link" name="link" type="url" placeholder={t("fields.linkPlaceholder")} />
          </Field>
        </div>
        <Field label={t("fields.difficulty")} optional>
          <DifficultyPicker />
        </Field>
        <Field label={t("fields.cover")} optional>
          <CoverDropzone />
        </Field>
      </FormSection>

      <FormSection>
        <Field label={tVisibility("label")}>
          <VisibilityPicker />
        </Field>
        <Field label={t("fields.invite")} hint={t("fields.inviteHint")}>
          <FriendPicker friends={friends} />
        </Field>
      </FormSection>

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          {t("submitPlan")}
        </Button>
      </div>
    </form>
  );
}
