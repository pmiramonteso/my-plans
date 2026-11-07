import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { DemoButton } from "@/components/shared/demo-button";
import { DemoNotice } from "@/components/shared/demo-notice";
import { Panel } from "@/components/shared/detail";
import { Field } from "@/components/shared/form-parts";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PreferencesForm } from "@/features/profiles/components/preferences-form";
import { getCurrentProfile } from "@/features/profiles/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("settings.title");

export default async function SettingsPage() {
  const [t, tNav] = await Promise.all([getTranslations("settings"), getTranslations("nav")]);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DemoNotice />
      <PageHeader title={t("title")} className="mb-0 md:mb-0" />

      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <ProfileSection />
      </Suspense>

      <Panel title={t("preferences")}>
        <PreferencesForm />
      </Panel>

      <Panel title={t("account")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">{t("logoutHint")}</p>
          {/* TODO(Fase 3): Server Action signOut. */}
          <DemoButton variant="destructive">
            <LogOut data-icon="inline-start" />
            {tNav("logout")}
          </DemoButton>
        </div>
      </Panel>
    </div>
  );
}

// TODO(Fase 3): formulario con React Hook Form + Zod y subida del avatar.
async function ProfileSection() {
  const [t, tCommon, profile] = await Promise.all([
    getTranslations("settings"),
    getTranslations("common"),
    getCurrentProfile(),
  ]);
  return (
    <Panel title={t("profile")}>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <UserAvatar profile={profile} size="lg" />
          <DemoButton variant="outline" size="sm">
            {t("avatar")}
          </DemoButton>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("displayName")} htmlFor="displayName">
            <Input id="displayName" name="displayName" defaultValue={profile.displayName} />
          </Field>
          <Field label={t("username")} htmlFor="username">
            <div className="relative">
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                @
              </span>
              <Input
                id="username"
                name="username"
                defaultValue={profile.username}
                className="pl-7"
                pattern="[a-z0-9_]{3,20}"
              />
            </div>
          </Field>
        </div>
        <Field label={t("bio")} htmlFor="bio" optional>
          <Textarea id="bio" name="bio" rows={3} maxLength={280} defaultValue={profile.bio ?? ""} />
        </Field>
        <div className="flex justify-end">
          <DemoButton>{tCommon("save")}</DemoButton>
        </div>
      </div>
    </Panel>
  );
}
