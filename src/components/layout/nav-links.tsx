"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { BOTTOM_NAV, isActive, SIDEBAR_NAV } from "./nav-config";

// usePathname() es dato de URL: en el shell estático la navegación se pinta sin
// elemento activo y el resaltado llega en streaming (sin salto de layout).

export function SidebarNav() {
  return (
    <Suspense fallback={<SidebarLinks pathname={null} />}>
      <ActiveSidebarLinks />
    </Suspense>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={<BottomLinks pathname={null} />}>
      <ActiveBottomLinks />
    </Suspense>
  );
}

function ActiveSidebarLinks() {
  return <SidebarLinks pathname={usePathname()} />;
}

function ActiveBottomLinks() {
  return <BottomLinks pathname={usePathname()} />;
}

function SidebarLinks({ pathname }: { pathname: string | null }) {
  const t = useTranslations("nav");
  return (
    <ul className="space-y-1">
      {SIDEBAR_NAV.map(({ href, key, icon: Icon }) => {
        const active = pathname !== null && isActive(pathname, href);
        return (
          <li key={key}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon aria-hidden className={cn("size-5", active && "text-primary")} />
              {t(key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function BottomLinks({ pathname }: { pathname: string | null }) {
  const t = useTranslations("nav");
  return (
    <nav
      aria-label={t("main")}
      className="safe-bottom bg-background/90 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {BOTTOM_NAV.map(({ href, key, icon: Icon }) => {
          const active = pathname !== null && isActive(pathname, href);
          if (key === "create") {
            return (
              <li key={key} className="flex items-center justify-center">
                <Link
                  href={href}
                  aria-label={t(key)}
                  aria-current={active ? "page" : undefined}
                  className="bg-accent text-accent-foreground shadow-accent/30 flex size-12 -translate-y-3 items-center justify-center rounded-full shadow-lg transition active:scale-95"
                >
                  <Icon aria-hidden className="size-6" strokeWidth={2.25} />
                </Link>
              </li>
            );
          }
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[0.7rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
