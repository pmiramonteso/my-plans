import "server-only";

import { loadMocks } from "@/mocks/data";

// TODO(Fase 7): leer de Supabase (notifications, paginación keyset).

export async function getNotifications() {
  return (await loadMocks()).notifications;
}

export async function getUnreadCount() {
  return (await getNotifications()).filter((n) => !n.readAt).length;
}
