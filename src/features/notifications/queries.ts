import "server-only";

import { DESIGN_PREVIEW } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";
import { loadMocks } from "@/mocks/data";

// TODO(Fase 7): leer de Supabase (notifications, paginación keyset).
export async function getNotifications() {
  return (await loadMocks()).notifications;
}

// La RLS limita la cuenta a mis notificaciones.
// TODO(Fase 7): actualizar en tiempo real (Supabase Realtime).
export async function getUnreadCount() {
  if (DESIGN_PREVIEW) return (await getNotifications()).filter((n) => !n.readAt).length;
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}
