"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/shared/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/features/profiles/actions";
import { profileSchema, type ProfileInput } from "@/features/profiles/schemas";
import type { Profile } from "@/features/profiles/types";
import { fieldMessage, reportActionError } from "@/lib/form";

import { UsernameInput } from "./username-input";

export function ProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio ?? "",
    },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateProfile(values);
      if (!result.ok) {
        reportActionError(result, t, form.setError, {
          conflict: { field: "username", message: t("onboarding.usernameTaken") },
        });
        return;
      }
      form.reset(values);
      toast.success(t("settings.saved"));
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t("settings.displayName")}
          htmlFor="displayName"
          error={fieldMessage(t, errors.displayName?.message)}
        >
          <Input
            id="displayName"
            autoComplete="name"
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby="displayName-message"
            {...form.register("displayName")}
          />
        </Field>
        <Field
          label={t("settings.username")}
          htmlFor="username"
          error={fieldMessage(t, errors.username?.message)}
        >
          <UsernameInput
            id="username"
            invalid={Boolean(errors.username)}
            {...form.register("username")}
          />
        </Field>
      </div>
      <Field
        label={t("settings.bio")}
        htmlFor="bio"
        optional
        error={fieldMessage(t, errors.bio?.message)}
      >
        <Textarea
          id="bio"
          rows={3}
          maxLength={280}
          aria-invalid={Boolean(errors.bio)}
          aria-describedby="bio-message"
          {...form.register("bio")}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !isDirty}>
          {pending && <Loader2 className="animate-spin" />}
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
