import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/layout/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingForm } from "@/features/profiles/components/onboarding-form";
import { getSessionProfile } from "@/features/profiles/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("onboarding.title");

export default async function OnboardingPage() {
  const t = await getTranslations("onboarding");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <Logo />
      <div className="animate-rise bg-card w-full max-w-md space-y-6 rounded-3xl border p-6 sm:p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
          <Onboarding />
        </Suspense>
      </div>
    </div>
  );
}

async function Onboarding() {
  const profile = await getSessionProfile();
  if (profile.username) redirect("/");
  return <OnboardingForm defaultDisplayName={profile.displayName} />;
}
