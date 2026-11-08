"use client";

import { Check, EyeOff, ImagePlus, Lock, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { CategoryIcon } from "@/components/shared/category";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Label } from "@/components/ui/label";
import { CATEGORY_SLUGS, type CategorySlug } from "@/features/categories/config";
import type { Visibility } from "@/features/plans/types";
import type { ProfileSummary } from "@/features/profiles/types";
import { cn } from "@/lib/utils";

// Piezas de formulario con inputs nativos (radio/checkbox): funcionan con
// FormData y con React Hook Form (`register`) sin adaptadores.

// Con `error`, el mensaje sustituye a la pista. El input debe llevar
// aria-invalid y aria-describedby={`${htmlFor}-message`}.
export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("common");
  const message = error ?? hint;
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="text-muted-foreground font-normal">({t("optional")})</span>}
      </Label>
      {children}
      {message && (
        <p
          id={htmlFor && `${htmlFor}-message`}
          role={error ? "alert" : undefined}
          className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export function FormSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <fieldset className="bg-card space-y-5 rounded-2xl border p-4 sm:p-6">
      {title && (
        <legend className="font-heading float-left mb-1 text-lg font-semibold">{title}</legend>
      )}
      <div className="clear-both space-y-5">{children}</div>
    </fieldset>
  );
}

export function CategoryPicker({
  name = "category",
  defaultValue,
}: {
  name?: string;
  defaultValue?: CategorySlug;
}) {
  const t = useTranslations("categories");
  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className="grid grid-cols-4 gap-2 sm:grid-cols-7"
    >
      {CATEGORY_SLUGS.map((slug) => (
        <label key={slug} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={slug}
            defaultChecked={slug === defaultValue}
            className="peer sr-only"
            required
          />
          <span className="bg-background peer-checked:border-primary peer-checked:bg-primary/8 peer-checked:ring-primary peer-focus-visible:ring-ring/50 hover:border-primary/50 flex flex-col items-center gap-1.5 rounded-xl border px-1 py-3 text-center text-xs font-medium transition peer-checked:ring-1 peer-focus-visible:ring-3">
            <CategoryIcon category={slug} className="size-6" />
            {t(slug)}
          </span>
        </label>
      ))}
    </div>
  );
}

const VISIBILITY_ICON = { private: Lock, invited: EyeOff, friends: Users } as const;

export function VisibilityPicker({
  name = "visibility",
  defaultValue = "invited",
  options = ["private", "invited", "friends"],
}: {
  name?: string;
  defaultValue?: Visibility;
  options?: Visibility[];
}) {
  const t = useTranslations("visibility");
  return (
    <div role="radiogroup" aria-label={t("label")} className="grid gap-2 sm:grid-cols-3">
      {options.map((v) => {
        const Icon = VISIBILITY_ICON[v];
        return (
          <label key={v} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={v}
              defaultChecked={v === defaultValue}
              className="peer sr-only"
            />
            <span className="bg-background peer-checked:border-primary peer-checked:bg-primary/8 peer-checked:ring-primary peer-focus-visible:ring-ring/50 hover:border-primary/50 flex h-full gap-3 rounded-xl border p-3 transition peer-checked:ring-1 peer-focus-visible:ring-3">
              <Icon aria-hidden className="text-primary mt-0.5 size-4 shrink-0" />
              <span>
                <span className="block text-sm font-medium">{t(v)}</span>
                <span className="text-muted-foreground block text-xs">{t(`${v}Hint`)}</span>
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function FriendPicker({
  friends,
  name = "invitees",
  defaultSelected = [],
}: {
  friends: ProfileSummary[];
  name?: string;
  defaultSelected?: string[];
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {friends.map((f) => (
        <li key={f.id}>
          <label className="cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value={f.id}
              defaultChecked={defaultSelected.includes(f.id)}
              className="peer sr-only"
            />
            <span className="bg-background peer-checked:border-primary peer-checked:bg-primary/8 peer-focus-visible:ring-ring/50 flex h-10 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition peer-focus-visible:ring-3 [&_.check]:hidden peer-checked:[&_.check]:block">
              <UserAvatar profile={f} size="sm" />
              {f.displayName.split(" ")[0]}
              <Check aria-hidden className="check text-primary size-4" />
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

// TODO(Fase 4): compresión en el cliente (WebP) y subida a Storage.
export function CoverDropzone({ name = "cover" }: { name?: string }) {
  const t = useTranslations("create.fields");
  return (
    <label className="bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground has-[:focus-visible]:ring-ring/50 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm transition has-[:focus-visible]:ring-3">
      <ImagePlus aria-hidden className="size-7" strokeWidth={1.5} />
      {t("coverHint")}
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="sr-only"
      />
    </label>
  );
}

export function DifficultyPicker({
  name = "difficulty",
  defaultValue,
}: {
  name?: string;
  defaultValue?: number | null;
}) {
  const t = useTranslations("create.fields");
  return (
    <div role="radiogroup" aria-label={t("difficulty")} className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={n}
            defaultChecked={n === defaultValue}
            className="peer sr-only"
          />
          <span className="bg-background peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-ring/50 hover:border-accent/60 flex size-10 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition peer-focus-visible:ring-3">
            {n}
          </span>
        </label>
      ))}
    </div>
  );
}
