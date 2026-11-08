"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  CategoryPicker,
  CoverPicker,
  DifficultyPicker,
  Field,
  FormSection,
  FriendPicker,
  VisibilityPicker,
} from "@/components/shared/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPlan, setPlanCover, updatePlan } from "@/features/plans/actions";
import { planSchema, type PlanFormOutput, type PlanFormValues } from "@/features/plans/schemas";
import type { ProfileSummary } from "@/features/profiles/types";
import { fieldMessage, reportActionError } from "@/lib/form";
import { attachCover } from "@/lib/upload-cover";

const EMPTY: Partial<PlanFormValues> = {
  title: "",
  description: "",
  location: "",
  link: "",
  difficulty: null,
  visibility: "invited",
  invitees: [],
};

// Crear (sin planId) o editar. Al editar, `friends` son solo los que aún no
// están invitados: se pueden añadir, no quitar.
export function PlanForm({
  friends,
  planId,
  defaults,
  coverUrl,
}: {
  friends: ProfileSummary[];
  planId?: string;
  defaults?: Partial<PlanFormValues>;
  coverUrl?: string | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cover, setCover] = useState<File | null>(null);
  const form = useForm<PlanFormValues, unknown, PlanFormOutput>({
    resolver: zodResolver(planSchema),
    defaultValues: { ...EMPTY, ...defaults },
  });
  const { errors } = form.formState;
  const visibility = useWatch({ control: form.control, name: "visibility" });
  const msg = (m?: string) => fieldMessage(t, m);

  // El action recibe los valores del formulario tal cual y los valida de nuevo.
  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const values = form.getValues();
      const result = planId
        ? await updatePlan({ ...values, id: planId })
        : await createPlan(values);
      if (!result.ok) return reportActionError(result, t, form.setError);

      const id = result.data.id;
      if (cover && !(await attachCover("plans", id, cover, setPlanCover))) {
        toast.error(t("create.coverError"));
      }
      router.push(`/plans/${id}`);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormSection>
        <Field label={t("create.fields.title")} htmlFor="title" error={msg(errors.title?.message)}>
          <Input
            id="title"
            maxLength={120}
            placeholder={t("create.fields.titlePlaceholder")}
            aria-invalid={Boolean(errors.title)}
            aria-describedby="title-message"
            {...form.register("title")}
          />
        </Field>
        <Field label={t("categories.label")} error={msg(errors.category?.message)}>
          <CategoryPicker field={form.register("category")} />
        </Field>
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
      </FormSection>

      <FormSection>
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
              {...form.register("location")}
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
              aria-invalid={Boolean(errors.link)}
              aria-describedby="link-message"
              {...form.register("link")}
            />
          </Field>
        </div>
        <Field label={t("create.fields.difficulty")} optional>
          <DifficultyPicker field={form.register("difficulty")} />
        </Field>
        <Field label={t("create.fields.cover")} optional>
          <CoverPicker file={cover} onChange={setCover} currentUrl={coverUrl} />
        </Field>
      </FormSection>

      <FormSection>
        <Field label={t("visibility.label")}>
          <VisibilityPicker field={form.register("visibility")} />
        </Field>
        {visibility !== "private" && friends.length > 0 && (
          <Field
            label={t(planId ? "create.fields.inviteMore" : "create.fields.invite")}
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
          {planId ? t("common.save") : t("create.submitPlan")}
        </Button>
      </div>
    </form>
  );
}
