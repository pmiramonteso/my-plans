import type { NotificationType } from "./types";

// Adónde lleva cada notificación. entity_type/entity_id vienen de los triggers:
// 'profile' → el otro usuario, 'plan' → la propuesta, 'event' → el evento.
export function notificationHref(
  type: NotificationType,
  entityType: string,
  entityId: string,
  username: string | null, // del perfil de entity_id, si es un perfil
): string {
  if (type === "friend_request") return "/friends/requests";
  switch (entityType) {
    case "profile":
      return username ? `/u/${username}` : "/friends";
    case "plan":
      return `/plans/${entityId}`;
    case "event":
      return `/events/${entityId}`;
    default:
      return "/notifications";
  }
}

// Cursor de la paginación keyset (created_at, id), en la URL como ?before=…
export type NotificationCursor = { createdAt: string; id: string };

export function encodeCursor({ createdAt, id }: NotificationCursor) {
  return `${createdAt}_${id}`;
}

export function decodeCursor(value: unknown): NotificationCursor | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:?\d{2}))_([0-9a-f-]{36})$/i.exec(value);
  if (!match || Number.isNaN(Date.parse(match[1]))) return null;
  return { createdAt: match[1], id: match[2] };
}
