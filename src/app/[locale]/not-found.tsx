import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LogoMark } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-4 text-center">
      <LogoMark className="size-14 opacity-80" />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <Button asChild>
        <Link href="/">{t("back")}</Link>
      </Button>
    </div>
  );
}
