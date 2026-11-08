"use client";

import { useOptimistic, useTransition } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Field } from "@/components/shared/form-parts";
import { setLocale } from "@/features/profiles/actions";
import { LOCALES, type Locale } from "@/i18n/config";
import { reportActionError } from "@/lib/form";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

export function PreferencesForm() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [shownLocale, setShownLocale] = useOptimistic(locale);
  const [, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();

  // Guarda el idioma en el perfil y en la cookie; al refrescar, el proxy sirve
  // la app en el idioma nuevo.
  const changeLocale = (next: string) =>
    startTransition(async () => {
      setShownLocale(next as Locale);
      const result = await setLocale({ locale: next as Locale });
      if (!result.ok) reportActionError(result, t);
    });

  return (
    <div className="space-y-5">
      <Field label={t("settings.language")}>
        <Segmented
          name="locale"
          value={shownLocale}
          onChange={changeLocale}
          options={LOCALES.map((l) => ({ value: l, label: t(`languages.${l}`) }))}
        />
      </Field>
      <Field label={t("theme.label")}>
        <Segmented
          name="theme"
          value={theme ?? "system"}
          onChange={setTheme}
          options={THEMES.map(({ value, icon }) => ({ value, label: t(`theme.${value}`), icon }))}
        />
      </Field>
    </div>
  );
}

function Segmented({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
}) {
  return (
    <div
      role="radiogroup"
      className="bg-background inline-flex flex-wrap gap-1 rounded-xl border p-1"
    >
      {options.map(({ value: v, label, icon: Icon }) => (
        <label key={v} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={v}
            checked={value === v}
            onChange={() => onChange(v)}
            className="peer sr-only"
          />
          <span
            className={cn(
              "text-muted-foreground flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition",
              "peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-ring/50 hover:text-foreground peer-checked:hover:text-primary-foreground peer-focus-visible:ring-3",
            )}
          >
            {Icon && <Icon className="size-4" />}
            {label}
          </span>
        </label>
      ))}
    </div>
  );
}
