import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/layout/logo";
import { DemoButton } from "@/components/shared/demo-button";
import { Field } from "@/components/shared/form-parts";
import { Input } from "@/components/ui/input";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("onboarding.title");

// TODO(Fase 3): formulario real (RHF + Zod) que rellene profiles.username y onboarded_at.
export default async function OnboardingPage() {
  const [t, tSettings] = await Promise.all([
    getTranslations("onboarding"),
    getTranslations("settings"),
  ]);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <Logo />
      <div className="animate-rise bg-card w-full max-w-md space-y-6 rounded-3xl border p-6 sm:p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Field label={tSettings("username")} htmlFor="username" hint={t("usernameHint")}>
          <div className="relative">
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
              @
            </span>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              pattern="[a-z0-9_]{3,20}"
              className="h-12 pl-7 text-base"
            />
          </div>
        </Field>
        <Field label={tSettings("displayName")} htmlFor="displayName">
          <Input id="displayName" name="displayName" className="h-12 text-base" />
        </Field>
        <DemoButton size="lg" className="w-full">
          {t("submit")}
        </DemoButton>
      </div>
    </div>
  );
}
