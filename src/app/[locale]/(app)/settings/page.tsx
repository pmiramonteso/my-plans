import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Panel } from "@/components/shared/detail";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "@/features/auth/actions";
import { AvatarUpload } from "@/features/profiles/components/avatar-upload";
import { DeleteAccount } from "@/features/profiles/components/delete-account";
import { PreferencesForm } from "@/features/profiles/components/preferences-form";
import { ProfileForm } from "@/features/profiles/components/profile-form";
import { getCurrentProfile } from "@/features/profiles/queries";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("settings.title");

export default async function SettingsPage() {
  const [t, tNav] = await Promise.all([getTranslations("settings"), getTranslations("nav")]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("title")} />
      <div className="space-y-6">
        <Panel title={t("profile")}>
          <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
            <ProfileSection />
          </Suspense>
        </Panel>

        <Panel title={t("preferences")}>
          <PreferencesForm />
        </Panel>

        <Panel title={t("account")}>
          <form action={signOut} className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">{t("logoutHint")}</p>
            <Button type="submit" variant="destructive">
              <LogOut data-icon="inline-start" />
              {tNav("logout")}
            </Button>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
            <p className="text-muted-foreground max-w-sm text-sm">{t("deleteAccountHint")}</p>
            <Suspense fallback={<Skeleton className="h-10 w-40" />}>
              <DeleteAccountSection />
            </Suspense>
          </div>
        </Panel>
      </div>
    </div>
  );
}

async function DeleteAccountSection() {
  const profile = await getCurrentProfile();
  return <DeleteAccount username={profile.username} />;
}

async function ProfileSection() {
  const profile = await getCurrentProfile();
  return (
    <div className="space-y-6">
      <AvatarUpload profile={profile} />
      <ProfileForm profile={profile} />
    </div>
  );
}
