"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CheckCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { markAllNotificationsRead, markNotificationRead } from "@/features/notifications/actions";
import { reportActionError } from "@/lib/form";

// Enlace de una notificación: al abrirla se marca como leída (sin esperar).
export function NotificationLink({
  id,
  unread,
  href,
  className,
  children,
}: {
  id: string;
  unread: boolean;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (unread) void markNotificationRead({ id });
      }}
    >
      {children}
    </Link>
  );
}

export function MarkAllReadButton() {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markAllNotificationsRead({});
          if (!result.ok) reportActionError(result, t);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <CheckCheck data-icon="inline-start" />}
      {t("notifications.markAllRead")}
    </Button>
  );
}
