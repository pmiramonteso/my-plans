"use client";

import Link from "next/link";
import { History, LogOut, Monitor, Moon, Settings, Sun, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProfileSummary } from "@/features/profiles/types";
import { cn } from "@/lib/utils";

export function UserMenu({
  profile,
  variant,
}: {
  profile: ProfileSummary;
  variant: "sidebar" | "compact";
}) {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("nav.userMenu")}
        className={cn(
          "focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg text-left transition-colors outline-none focus-visible:ring-3",
          variant === "sidebar" ? "hover:bg-sidebar-accent w-full p-2" : "rounded-full",
        )}
      >
        <UserAvatar profile={profile} size={variant === "sidebar" ? "md" : "sm"} />
        {variant === "sidebar" && (
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{profile.displayName}</span>
            <span className="text-muted-foreground block truncate text-xs">
              @{profile.username}
            </span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "sidebar" ? "start" : "end"}
        side={variant === "sidebar" ? "top" : "bottom"}
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <span className="block font-medium">{profile.displayName}</span>
          <span className="text-muted-foreground block text-xs">@{profile.username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/u/${profile.username}`}>
            <UserRound /> {t("nav.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/history">
            <History /> {t("nav.history")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> {t("nav.settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="dark:hidden" />
            <Moon className="hidden dark:block" />
            {t("theme.label")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun /> {t("theme.light")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon /> {t("theme.dark")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor /> {t("theme.system")}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        {/* TODO(Fase 3): Server Action signOut. */}
        <DropdownMenuItem onSelect={() => toast(t("common.demoAction"))}>
          <LogOut /> {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
