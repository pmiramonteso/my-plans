"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { CATEGORY_IDS } from "@/features/categories/config";
import { syncPeaks } from "@/features/peaks/sync";
import { getSessionProfile } from "@/features/profiles/queries";
import { createAction, unwrap } from "@/lib/action";
import { removeCover } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

import {
  planCoverSchema,
  planIdSchema,
  planInterestSchema,
  planSchema,
  updatePlanSchema,
} from "./schemas";

// Crea la propuesta y sus invitaciones en una transacción (RPC create_plan).
// El id se genera aquí para que el cliente suba la portada a su carpeta.
export const createPlan = createAction(planSchema, async (input) => {
  const supabase = await createClient();
  const id = unwrap(
    await supabase.rpc("create_plan", {
      p_id: crypto.randomUUID(),
      p_title: input.title,
      p_category_id: CATEGORY_IDS[input.category],
      p_description: input.description ?? undefined,
      p_external_url: input.link ?? undefined,
      p_difficulty: input.difficulty ?? undefined,
      p_location_name: input.location ?? undefined,
      p_visibility: input.visibility,
      p_invitee_ids: input.invitees,
    }),
  );
  await syncPeaks(supabase, { plan: id }, input.peaks);
  return { id };
});

// Edita los datos e invita a amigos nuevos (no quita invitaciones existentes).
export const updatePlan = createAction(updatePlanSchema, async ({ id, ...input }) => {
  const supabase = await createClient();
  const profile = await getSessionProfile();

  unwrap(
    await supabase
      .from("plans")
      .update({
        title: input.title,
        category_id: CATEGORY_IDS[input.category],
        description: input.description,
        external_url: input.link,
        difficulty: input.difficulty,
        location_name: input.location,
        visibility: input.visibility,
      })
      .eq("id", id)
      .select("id")
      .single(), // sin fila = sin permiso (RLS)
  );

  if (input.invitees.length > 0) {
    unwrap(
      await supabase.from("plan_invitations").upsert(
        input.invitees.map((user_id) => ({ plan_id: id, user_id, invited_by: profile.id })),
        { onConflict: "plan_id,user_id", ignoreDuplicates: true },
      ),
    );
  }
  await syncPeaks(supabase, { plan: id }, input.peaks);
  refresh();
  return { id };
});

export const setPlanCover = createAction(planCoverSchema, async ({ id, path }) => {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("plans")
    .select("cover_path")
    .eq("id", id)
    .maybeSingle();
  const previous = current?.cover_path ?? null;
  unwrap(
    await supabase.from("plans").update({ cover_path: path }).eq("id", id).select("id").single(),
  );
  await removeCover(supabase, previous, `plans/${id}`, path);
  refresh();
});

export const setPlanInterest = createAction(planInterestSchema, async ({ planId, interest }) => {
  const supabase = await createClient();
  unwrap(await supabase.rpc("set_plan_interest", { p_plan: planId, p_interest: interest }));
  refresh();
});

// Borrado lógico (solo el creador). Los eventos ya creados se conservan.
export const deletePlan = createAction(planIdSchema, async ({ id }) => {
  const supabase = await createClient();
  unwrap(await supabase.rpc("delete_plan", { p_plan: id }));
  redirect("/plans");
});
