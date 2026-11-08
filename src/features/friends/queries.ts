import "server-only";

import { loadMocks, PROFILES } from "@/mocks/data";

// TODO(Fase 3): leer de Supabase (friendships, profiles).

export async function getFriends() {
  return (await loadMocks()).friends;
}

export async function getFriendRequests() {
  return (await loadMocks()).requests;
}

export async function getProfileByUsername(username: string) {
  await loadMocks();
  return PROFILES.find((p) => p.username === username) ?? null;
}
