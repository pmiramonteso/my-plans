import { CATEGORIES, CATEGORY_TONE, type CategorySlug } from "@/features/categories/config";
import { cn } from "@/lib/utils";

// Portada de un plan o evento. Sin foto, un degradado con el icono de la
// categoría y un perfil de montañas, para que ninguna tarjeta quede vacía.
export function Cover({
  src,
  category,
  className,
  iconClassName,
}: {
  src: string | null;
  category: CategorySlug;
  className?: string;
  iconClassName?: string;
}) {
  const { icon: Icon, color } = CATEGORIES[category];

  if (src) {
    return (
      // Las portadas son signed URLs de Supabase: sin optimización de next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={cn("bg-muted object-cover", className)} />
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        CATEGORY_TONE[color].soft,
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className={cn(
          "absolute inset-x-0 bottom-0 h-1/2 w-full opacity-25",
          CATEGORY_TONE[color].text,
        )}
      >
        <path
          d="M0 120 L0 80 L60 40 L110 75 L170 20 L230 70 L280 45 L340 85 L400 55 L400 120 Z"
          fill="currentColor"
        />
      </svg>
      <Icon
        aria-hidden
        strokeWidth={1.5}
        className={cn("relative size-10", CATEGORY_TONE[color].text, iconClassName)}
      />
    </div>
  );
}
