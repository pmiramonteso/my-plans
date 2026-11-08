import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { GoogleButton, LoginForm } from "@/features/auth/components/login-form";
import { pageTitle } from "@/lib/metadata";

export const generateMetadata = pageTitle("login.title");

export default async function LoginPage() {
  const t = await getTranslations("login");
  return (
    <div className="animate-rise w-full max-w-md space-y-8 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold text-balance sm:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground text-lg text-pretty">{t("subtitle")}</p>
      </div>
      <Suspense
        fallback={
          <form>
            <GoogleButton label={t("google")} disabled />
          </form>
        }
      >
        <LoginForm />
      </Suspense>
      <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm">
        <ShieldCheck aria-hidden className="size-4" />
        {t("private")}
      </p>
    </div>
  );
}
