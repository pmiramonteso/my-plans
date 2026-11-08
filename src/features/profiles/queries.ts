import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";
import { ME } from "@/mocks/data";
import type { Tables } from "@/types/database";

import type { Profile, ProfileSummary, SessionProfile } from "./types";

export const PROFILE_SUMMARY_COLUMNS = "id, username, display_name, avatar_url";
const PROFILE_COLUMNS = `${PROFILE_SUMMARY_COLUMNS}, bio, locale, timezone`;

type SummaryRow = Pick<Tables<"profiles">, "id" | "username" | "display_name" | "avatar_url">;
type ProfileRow = SummaryRow & Pick<Tables<"profiles">, "bio" | "locale" | "timezone">;

// Solo para perfiles con onboarding hecho (los demás no aparecen en búsquedas
// ni pueden ser amigos).
export function toProfileSummary(row: SummaryRow): ProfileSummary {
  return {
    id: row.id,
    username: row.username ?? "",
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

function toProfile(row: ProfileRow): SessionProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    locale: isLocale(row.locale) ? row.locale : DEFAULT_LOCALE,
    timezone: row.timezone,
  };
}

// Capa de acceso: una sola lectura de sesión + perfil por petición.
// getClaims() valida la firma del JWT (nunca getSession() en el servidor).
export const getSessionProfile = cache(async (): Promise<SessionProfile> => {
  if (DESIGN_PREVIEW) return ME;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .single();
  if (!data) redirect("/login");
  return toProfile(data);
});

// Usuario con onboarding completo; si no, lo manda a elegir username.
export async function getCurrentProfile(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile.username) redirect("/onboarding");
  return { ...profile, username: profile.username };
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (DESIGN_PREVIEW) {
    const { PROFILES } = await import("@/mocks/data");
    return PROFILES.find((p) => p.username === username) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!data?.username) return null;
  return { ...toProfile(data), username: data.username };
}

export async function getProfilesByIds(ids: string[]): Promise<Map<string, ProfileSummary>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select(PROFILE_SUMMARY_COLUMNS).in("id", ids);
  return new Map((data ?? []).map((row) => [row.id, toProfileSummary(row)]));
}
