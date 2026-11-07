import "server-only";

import { loadMocks, ME } from "@/mocks/data";

// TODO(Fase 3): perfil del usuario con sesión (getClaims + profiles).

export async function getCurrentProfile() {
  await loadMocks();
  return ME;
}
