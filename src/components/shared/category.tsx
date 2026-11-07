import { useTranslations } from "next-intl";

import { CATEGORIES, CATEGORY_TONE, type CategorySlug } from "@/features/categories/config";
import { cn } from "@/lib/utils";

export function CategoryIcon({
  category,
  className,
}: {
  category: CategorySlug;
  className?: string;
}) {
  const { icon: Icon, color } = CATEGORIES[category];
  return <Icon aria-hidden className={cn("size-4", CATEGORY_TONE[color].text, className)} />;
}

export function CategoryBadge({
  category,
  className,
}: {
  category: CategorySlug;
  className?: string;
}) {
  const t = useTranslations("categories");
  const { color } = CATEGORIES[category];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
        CATEGORY_TONE[color].soft,
        className,
      )}
    >
      <CategoryIcon category={category} className="size-3.5" />
      {t(category)}
    </span>
  );
}
