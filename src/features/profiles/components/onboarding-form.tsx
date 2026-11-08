"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Field } from "@/components/shared/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeOnboarding } from "@/features/profiles/actions";
import { onboardingSchema, type OnboardingInput } from "@/features/profiles/schemas";
import { fieldMessage, reportActionError } from "@/lib/form";

import { UsernameInput } from "./username-input";

export function OnboardingForm({ defaultDisplayName }: { defaultDisplayName: string }) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { username: "", displayName: defaultDisplayName },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Si sale bien, el action redirige al inicio.
      const result = await completeOnboarding({ ...values, timezone });
      if (!result.ok) {
        reportActionError(result, t, form.setError, {
          conflict: { field: "username", message: t("onboarding.usernameTaken") },
        });
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field
        label={t("settings.username")}
        htmlFor="username"
        hint={t("onboarding.usernameHint")}
        error={fieldMessage(t, errors.username?.message)}
      >
        <UsernameInput
          id="username"
          autoFocus
          invalid={Boolean(errors.username)}
          {...form.register("username")}
        />
      </Field>
      <Field
        label={t("settings.displayName")}
        htmlFor="displayName"
        error={fieldMessage(t, errors.displayName?.message)}
      >
        <Input
          id="displayName"
          autoComplete="name"
          className="h-12 text-base"
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby="displayName-message"
          {...form.register("displayName")}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {t("onboarding.submit")}
      </Button>
    </form>
  );
}
