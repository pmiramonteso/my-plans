import {
  CalendarDays,
  History,
  House,
  Lightbulb,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  key: "home" | "agenda" | "create" | "plans" | "friends" | "history";
  icon: LucideIcon;
};

export const NAV = {
  home: { href: "/", key: "home", icon: House },
  agenda: { href: "/agenda", key: "agenda", icon: CalendarDays },
  create: { href: "/create", key: "create", icon: Plus },
  plans: { href: "/plans", key: "plans", icon: Lightbulb },
  friends: { href: "/friends", key: "friends", icon: Users },
  history: { href: "/history", key: "history", icon: History },
} satisfies Record<string, NavItem>;

// Móvil: 5 huecos con "Crear" en el centro. Historial y ajustes van en el menú del avatar.
export const BOTTOM_NAV: NavItem[] = [NAV.home, NAV.agenda, NAV.create, NAV.plans, NAV.friends];

export const SIDEBAR_NAV: NavItem[] = [NAV.home, NAV.agenda, NAV.plans, NAV.friends, NAV.history];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
