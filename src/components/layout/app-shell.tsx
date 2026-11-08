import { Suspense } from "react";
import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getUnreadCount } from "@/features/notifications/queries";
import { getCurrentProfile } from "@/features/profiles/queries";
import { cn } from "@/lib/utils";

import { Logo } from "./logo";
import { BottomNav, SidebarNav } from "./nav-links";
import { UserMenu } from "./user-menu";

// La estructura y la navegación son estáticas (shell prerenderizado); el
// usuario y el contador de notificaciones llegan en streaming.
export async function AppShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("nav");

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="bg-sidebar sticky top-0 hidden h-dvh flex-col gap-6 border-r p-4 md:flex">
        <Logo className="px-2 pt-2" />
        <Button asChild variant="accent" className="justify-start">
          <Link href="/create">
            <Plus data-icon="inline-start" />
            {t("create")}
          </Link>
        </Button>
        <nav aria-label={t("main")} className="flex-1 space-y-1">
          <SidebarNav />
          <Suspense fallback={<NotificationsLink count={0} label={t("notifications")} />}>
            <SidebarNotifications label={t("notifications")} />
          </Suspense>
        </nav>
        <Suspense fallback={<Skeleton className="h-14 w-full" />}>
          <CurrentUserMenu variant="sidebar" />
        </Suspense>
      </aside>

      <div className="min-w-0">
        <header className="bg-background/85 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur-lg md:hidden">
          <Logo className="text-lg [&_svg]:size-7" />
          <div className="flex items-center gap-1">
            <Suspense fallback={<BellButton count={0} label={t("notifications")} />}>
              <HeaderBell label={t("notifications")} />
            </Suspense>
            <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
              <CurrentUserMenu variant="compact" />
            </Suspense>
          </div>
        </header>

        <main className="pb-nav mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 md:px-10 md:pt-10 md:pb-12">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

async function CurrentUserMenu({ variant }: { variant: "sidebar" | "compact" }) {
  const profile = await getCurrentProfile();
  return <UserMenu profile={profile} variant={variant} />;
}

async function HeaderBell({ label }: { label: string }) {
  return <BellButton count={await getUnreadCount()} label={label} />;
}

async function SidebarNotifications({ label }: { label: string }) {
  return <NotificationsLink count={await getUnreadCount()} label={label} />;
}

function BellButton({ count, label }: { count: number; label: string }) {
  return (
    <Button asChild variant="ghost" size="icon" className="relative rounded-full">
      <Link href="/notifications" aria-label={label}>
        <Bell className="size-5" />
        {count > 0 && <CountDot count={count} className="absolute top-1 right-1" />}
      </Link>
    </Button>
  );
}

// TODO(Fase 7): el contador se actualiza en tiempo real (Supabase Realtime).
function NotificationsLink({ count, label }: { count: number; label: string }) {
  return (
    <Link
      href="/notifications"
      className="text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors"
    >
      <Bell aria-hidden className="size-5" />
      {label}
      {count > 0 && <CountDot count={count} className="ml-auto" />}
    </Link>
  );
}

function CountDot({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        "bg-accent text-accent-foreground flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[0.65rem] font-bold tabular-nums",
        className,
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
