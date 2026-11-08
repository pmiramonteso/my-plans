"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { CATEGORY_IDS } from "@/features/categories/config";
import { saveAscents, syncPeaks } from "@/features/peaks/sync";
import { getSessionProfile } from "@/features/profiles/queries";
import { createAction, unwrap } from "@/lib/action";
import { removeCover } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

import {
  completeEventSchema,
  eventCoverSchema,
  eventIdSchema,
  eventSchema,
  rsvpSchema,
  updateEventSchema,
} from "./schemas";

// Crear desde cero o a partir de una propuesta (planId): RPC create_event, que
// añade al organizador, a los invitados, copia las cimas y actualiza la propuesta.
export const createEvent = createAction(eventSchema, async (input) => {
  const supabase = await createClient();
  const id = unwrap(
    await supabase.rpc("create_event", {
      p_title: input.title,
      p_category_id: CATEGORY_IDS[input.category],
      p_starts_at: input.startsAt,
      p_ends_at: input.endsAt ?? undefined,
      p_all_day: input.allDay,
      p_timezone: input.timezone,
      p_description: input.description ?? undefined,
      p_extra_info: input.extraInfo ?? undefined,
      p_external_url: input.link ?? undefined,
      p_location_name: input.location ?? undefined,
      p_visibility: input.visibility,
      p_plan_id: input.planId,
      p_participant_ids: input.invitees,
    }),
  );
  // create_event ya copia las cimas de la propuesta; aquí quedan las elegidas.
  await syncPeaks(supabase, { event: id }, input.peaks);
  return { id };
});

// Los participantes reciben 'event_updated' (trigger) si cambian fecha o lugar.
export const updateEvent = createAction(updateEventSchema, async ({ id, ...input }) => {
  const supabase = await createClient();
  const profile = await getSessionProfile();

  unwrap(
    await supabase
      .from("events")
      .update({
        title: input.title,
        category_id: CATEGORY_IDS[input.category],
        description: input.description,
        extra_info: input.extraInfo,
        external_url: input.link,
        location_name: input.location,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        all_day: input.allDay,
        timezone: input.timezone,
        visibility: input.visibility,
      })
      .eq("id", id)
      .select("id")
      .single(), // sin fila = sin permiso (RLS)
  );

  if (input.invitees.length > 0) {
    unwrap(
      await supabase.from("event_participants").upsert(
        input.invitees.map((user_id) => ({ event_id: id, user_id, invited_by: profile.id })),
        { onConflict: "event_id,user_id", ignoreDuplicates: true },
      ),
    );
  }
  await syncPeaks(supabase, { event: id }, input.peaks);
  refresh();
  return { id };
});

export const setEventCover = createAction(eventCoverSchema, async ({ id, path }) => {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("events")
    .select("cover_path")
    .eq("id", id)
    .maybeSingle();
  const previous = current?.cover_path ?? null;
  unwrap(
    await supabase.from("events").update({ cover_path: path }).eq("id", id).select("id").single(),
  );
  // Si la portada venía de la propuesta (plans/…), no se borra.
  await removeCover(supabase, previous, `events/${id}`, path);
  refresh();
});

// Mi respuesta. Si el evento es visible para amigos y no estaba invitado, me
// apunto (RLS: event_participants_insert permite añadirse a uno mismo).
export const setRsvp = createAction(rsvpSchema, async ({ eventId, rsvp }) => {
  const supabase = await createClient();
  const profile = await getSessionProfile();
  const updated = unwrap(
    await supabase
      .from("event_participants")
      .update({ rsvp })
      .eq("event_id", eventId)
      .eq("user_id", profile.id)
      .select("event_id"),
  );
  if (updated.length === 0) {
    unwrap(
      await supabase
        .from("event_participants")
        .insert({ event_id: eventId, user_id: profile.id, rsvp }),
    );
  }
  refresh();
});

export const cancelEvent = createAction(eventIdSchema, async ({ id }) => {
  const supabase = await createClient();
  unwrap(await supabase.rpc("cancel_event", { p_event: id }));
  refresh();
});

// Marca el evento como realizado: solo los asistentes suman en historial y
// estadísticas. Los asistentes reciben 'event_completed' (trigger).
export const completeEvent = createAction(
  completeEventSchema,
  async ({ id, attendees, ascents }) => {
    const supabase = await createClient();
    // Antes de cerrar: las estadísticas se calculan con estos datos.
    await saveAscents(supabase, id, ascents);
    unwrap(await supabase.rpc("complete_event", { p_event: id, p_attendees: attendees }));
    redirect(`/events/${id}`);
  },
);

// Borrado lógico (solo el creador).
export const deleteEvent = createAction(eventIdSchema, async ({ id }) => {
  const supabase = await createClient();
  unwrap(await supabase.rpc("delete_event", { p_event: id }));
  redirect("/agenda");
});
