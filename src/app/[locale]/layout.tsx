import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { locale as rootLocale } from "next/root-params";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Providers } from "@/components/layout/providers";
import { DEFAULT_LOCALE, isLocale, LOCALES } from "@/i18n/config";

import "../globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

// Serif con carácter para los títulos; el eje SOFT redondea las terminaciones.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("tagline"),
    robots: { index: false, follow: false }, // red privada
  };
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F3EC" },
    { media: "(prefers-color-scheme: dark)", color: "#141A16" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const requested = await rootLocale();
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning // next-themes añade la clase del tema antes de hidratar
    >
      <body className="min-h-full">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
