import type { Locale } from "@/i18n/config";

// Datos públicos de un perfil (nunca el email).
export type ProfileSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type Profile = ProfileSummary & {
  bio: string | null;
  locale: Locale;
  timezone: string;
};

// Perfil del usuario con sesión: antes del onboarding aún no tiene username.
export type SessionProfile = Omit<Profile, "username"> & { username: string | null };
