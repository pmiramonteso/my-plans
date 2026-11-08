import "server-only";

import { loadMocks } from "@/mocks/data";

// TODO(Fase 4): leer de Supabase (plans + plan_invitations, RLS activa).

export type PlanFilter = "all" | "mine" | "invited";

export async function getPlans(filter: PlanFilter = "all") {
  const { plans } = await loadMocks();
  return plans.filter((p) => {
    if (p.status !== "open") return false;
    if (filter === "mine") return p.myInterest === null;
    if (filter === "invited") return p.myInterest !== null;
    return true;
  });
}

export async function getPlanInvitesPending() {
  return (await getPlans("invited")).filter((p) => p.myInterest === "pending");
}

export async function getPlan(id: string) {
  const { planDetail } = await loadMocks();
  return planDetail(id);
}
