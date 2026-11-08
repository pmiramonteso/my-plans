"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Contador de no leídas que se actualiza solo: Supabase Realtime avisa de cada
// notificación nueva o leída (Realtime aplica la RLS, solo llegan las mías) y
// se vuelve a contar. Si estoy en /notifications, también se refresca la lista.
export function UnreadBadge({
  userId,
  initial,
  live = true,
  className,
}: {
  userId: string;
  initial: number;
  live?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  // Un render del servidor (refresh tras una acción) trae el valor bueno.
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setCount(initial);
  }

  useEffect(() => {
    if (!live) return; // vista previa sin Supabase
    const supabase = createClient();
    let cancelled = false;

    const recount = async () => {
      const { count: unread } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (!cancelled && unread !== null) setCount(unread);
    };

    const channel = supabase
      // Nombre único: puede haber varios contadores (cabecera y barra lateral).
      .channel(`notifications:${userId}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          void recount();
          if (payload.eventType === "INSERT" && window.location.pathname === "/notifications") {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId, live, router]);

  if (count <= 0) return null;
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
