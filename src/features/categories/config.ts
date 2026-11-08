import {
  Building2,
  Footprints,
  Landmark,
  MountainSnow,
  Plane,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

// Refleja la tabla `categories` (seed de la migración 0100). Los nombres se
// traducen por slug en messages/*.json → categories.<slug>.
export const CATEGORY_SLUGS = [
  "hiking",
  "summit",
  "museum",
  "restaurant",
  "trip",
  "city",
  "other",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export type CategoryColor = "pine" | "granite" | "plum" | "ember" | "sky" | "sunrise" | "stone";

export const CATEGORIES: Record<CategorySlug, { icon: LucideIcon; color: CategoryColor }> = {
  hiking: { icon: Footprints, color: "pine" },
  summit: { icon: MountainSnow, color: "granite" },
  museum: { icon: Landmark, color: "plum" },
  restaurant: { icon: UtensilsCrossed, color: "ember" },
  trip: { icon: Plane, color: "sky" },
  city: { icon: Building2, color: "sunrise" },
  other: { icon: Sparkles, color: "stone" },
};

// Clases completas (Tailwind solo detecta literales).
export const CATEGORY_TONE: Record<CategoryColor, { text: string; bg: string; soft: string }> = {
  pine: { text: "text-cat-pine", bg: "bg-cat-pine", soft: "bg-cat-pine/12" },
  granite: { text: "text-cat-granite", bg: "bg-cat-granite", soft: "bg-cat-granite/12" },
  plum: { text: "text-cat-plum", bg: "bg-cat-plum", soft: "bg-cat-plum/12" },
  ember: { text: "text-cat-ember", bg: "bg-cat-ember", soft: "bg-cat-ember/12" },
  sky: { text: "text-cat-sky", bg: "bg-cat-sky", soft: "bg-cat-sky/12" },
  sunrise: { text: "text-cat-sunrise", bg: "bg-cat-sunrise", soft: "bg-cat-sunrise/12" },
  stone: { text: "text-cat-stone", bg: "bg-cat-stone", soft: "bg-cat-stone/12" },
};
