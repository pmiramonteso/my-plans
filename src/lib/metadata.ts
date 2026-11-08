import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

// `export const generateMetadata = pageTitle("nav.agenda")` en cada página.
export function pageTitle(key: string) {
  return async (): Promise<Metadata> => {
    const t = await getTranslations();
    return { title: t(key as Parameters<typeof t>[0]) };
  };
}
