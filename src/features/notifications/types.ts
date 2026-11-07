import type { ProfileSummary } from "@/features/profiles/types";

// Mismo enum que notification_type en la BD.
export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "plan_invite"
  | "plan_interest"
  | "event_invite"
  | "event_rsvp"
  | "event_updated"
  | "event_cancelled"
  | "event_completed"
  | "photos_added";

export type AppNotification = {
  id: string;
  type: NotificationType;
  actor: ProfileSummary | null;
  href: string;
  // Datos para componer el texto con i18n (título del plan, nº de fotos…).
  data: { title?: string; count?: number };
  readAt: string | null;
  createdAt: string;
};
