// Datos públicos de un perfil (nunca el email).
export type ProfileSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type Profile = ProfileSummary & {
  bio: string | null;
  locale: "es" | "en" | "ca";
  timezone: string;
};
