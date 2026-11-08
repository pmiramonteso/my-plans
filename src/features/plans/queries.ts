import "server-only";

import { categoryFromId } from "@/features/categories/config";
import { getCurrentProfile, getProfilesByIds } from "@/features/profiles/queries";
import type { ProfileSummary } from "@/features/profiles/types";
import { unwrap } from "@/lib/action";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { signCoverUrls } from "@/lib/storage";
import { createClient, type ServerSupabaseClient } from "@/lib/supabase/server";
import { loadMocks } from "@/mocks/data";
import type { Tables } from "@/types/database";

import type { PlanDetail, PlanInterest, PlanSummary } from "./types";

export type PlanFilter = "all" | "mine" | "invited";

const PLAN_COLUMNS =
  "id, creator_id, category_id, title, cover_path, location_name, status, visibility, created_at";
const PLAN_DETAIL_COLUMNS = `${PLAN_COLUMNS}, description, external_url, difficulty, address`;

type PlanRow = Pick<
  Tables<"plans">,
  | "id"
  | "creator_id"
  | "category_id"
  | "title"
  | "cover_path"
  | "location_name"
  | "status"
  | "visibility"
  | "created_at"
>;
type InvitationRow = Pick<Tables<"plan_invitations">, "plan_id" | "user_id" | "interest">;

// Une propuestas + invitaciones + perfiles + portadas (3 consultas en total,
// sin importar cuántas propuestas haya).
async function hydrate(
  supabase: ServerSupabaseClient,
  me: string,
  plans: PlanRow[],
): Promise<{
  summaries: PlanSummary[];
  invitations: InvitationRow[];
  profiles: Map<string, ProfileSummary>;
}> {
  if (plans.length === 0) return { summaries: [], invitations: [], profiles: new Map() };

  const invitations = unwrap(
    await supabase
      .from("plan_invitations")
      .select("plan_id, user_id, interest")
      .in(
        "plan_id",
        plans.map((p) => p.id),
      ),
  );
  const [profiles, covers] = await Promise.all([
    getProfilesByIds([
      ...new Set([...plans.map((p) => p.creator_id), ...invitations.map((i) => i.user_id)]),
    ]),
    signCoverUrls(
      supabase,
      plans.map((p) => p.cover_path),
    ),
  ]);

  const summaries = plans.flatMap((p): PlanSummary[] => {
    const creator = profiles.get(p.creator_id);
    if (!creator) return [];
    const mine = invitations.filter((i) => i.plan_id === p.id);
    return [
      {
        id: p.id,
        title: p.title,
        category: categoryFromId(p.category_id),
        coverUrl: p.cover_path ? (covers.get(p.cover_path) ?? null) : null,
        locationName: p.location_name,
        status: p.status,
        visibility: p.visibility,
        creator,
        interested: mine
          .filter((i) => i.interest === "interested")
          .flatMap((i) => profiles.get(i.user_id) ?? []),
        invitedCount: mine.length,
        // Creador → null. Invitado o amigo (visibilidad 'friends') → su interés.
        myInterest:
          p.creator_id === me ? null : (mine.find((i) => i.user_id === me)?.interest ?? "pending"),
        createdAt: p.created_at,
      },
    ];
  });
  return { summaries, invitations, profiles };
}

// Abiertas y visibles para mí (la RLS ya filtra las que no puedo ver).
export async function getPlans(filter: PlanFilter = "all"): Promise<PlanSummary[]> {
  if (DESIGN_PREVIEW) {
    const { plans } = await loadMocks();
    return plans.filter(
      (p) =>
        p.status === "open" &&
        (filter === "all" || (filter === "mine") === (p.myInterest === null)),
    );
  }

  const [me, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  let query = supabase
    .from("plans")
    .select(PLAN_COLUMNS)
    .is("deleted_at", null)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(60);

  if (filter === "mine") query = query.eq("creator_id", me.id);
  if (filter === "invited") {
    const ids = unwrap(
      await supabase.from("plan_invitations").select("plan_id").eq("user_id", me.id),
    ).map((i) => i.plan_id);
    if (ids.length === 0) return [];
    query = query.in("id", ids).neq("creator_id", me.id);
  }

  return (await hydrate(supabase, me.id, unwrap(await query))).summaries;
}

export async function getPlanInvitesPending(): Promise<PlanSummary[]> {
  return (await getPlans("invited")).filter((p) => p.myInterest === "pending");
}

export async function getPlan(id: string): Promise<PlanDetail | null> {
  if (DESIGN_PREVIEW) return (await loadMocks()).planDetail(id);

  const [me, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const { data: plan } = await supabase
    .from("plans")
    .select(PLAN_DETAIL_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!plan) return null;

  const [{ summaries, invitations, profiles }, peaks, events] = await Promise.all([
    hydrate(supabase, me.id, [plan]),
    supabase.from("plan_peaks").select("peaks(id, name, altitude_m)").eq("plan_id", id),
    supabase
      .from("events")
      .select("id, starts_at, status")
      .eq("plan_id", id)
      .is("deleted_at", null)
      .order("starts_at"),
  ]);
  const summary = summaries[0];
  if (!summary) return null;

  return {
    ...summary,
    description: plan.description,
    externalUrl: plan.external_url,
    difficulty: plan.difficulty,
    address: plan.address,
    peaks: unwrap(peaks).flatMap(({ peaks: p }) =>
      p ? [{ id: p.id, name: p.name, altitudeM: p.altitude_m }] : [],
    ),
    invitations: invitations.flatMap((i) => {
      const profile = profiles.get(i.user_id);
      return profile ? [{ profile, interest: i.interest as PlanInterest }] : [];
    }),
    events: unwrap(events).map((e) => ({ id: e.id, startsAt: e.starts_at, status: e.status })),
  };
}
