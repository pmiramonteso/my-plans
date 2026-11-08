import "server-only";

import { categoryFromId } from "@/features/categories/config";
import { getCurrentProfile, getProfilesByIds } from "@/features/profiles/queries";
import type { ProfileSummary } from "@/features/profiles/types";
import { unwrap } from "@/lib/action";
import { requestNow } from "@/lib/dates";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { signCoverUrls } from "@/lib/storage";
import { createClient, type ServerSupabaseClient } from "@/lib/supabase/server";
import { loadMocks } from "@/mocks/data";
import type { Tables } from "@/types/database";

import type { EventDetail, EventParticipant, EventSummary } from "./types";

const EVENT_COLUMNS =
  "id, creator_id, category_id, title, cover_path, starts_at, ends_at, all_day, timezone, location_name, status";
const EVENT_DETAIL_COLUMNS = `${EVENT_COLUMNS}, description, extra_info, external_url, address, visibility, plan_id`;

type EventRow = Pick<
  Tables<"events">,
  | "id"
  | "creator_id"
  | "category_id"
  | "title"
  | "cover_path"
  | "starts_at"
  | "ends_at"
  | "all_day"
  | "timezone"
  | "location_name"
  | "status"
>;
type ParticipantRow = Pick<
  Tables<"event_participants">,
  "event_id" | "user_id" | "role" | "rsvp" | "attended"
>;

// Eventos + participantes + perfiles + portadas + nº de fotos, en lote.
async function hydrate(supabase: ServerSupabaseClient, me: string, events: EventRow[]) {
  if (events.length === 0) {
    return {
      summaries: [] as EventSummary[],
      participants: [] as ParticipantRow[],
      profiles: new Map<string, ProfileSummary>(),
    };
  }
  const ids = events.map((e) => e.id);
  const [participants, photos] = await Promise.all([
    supabase
      .from("event_participants")
      .select("event_id, user_id, role, rsvp, attended")
      .in("event_id", ids)
      .then(unwrap),
    supabase.from("event_photos").select("event_id").in("event_id", ids).then(unwrap),
  ]);
  const [profiles, covers] = await Promise.all([
    getProfilesByIds([
      ...new Set([...events.map((e) => e.creator_id), ...participants.map((p) => p.user_id)]),
    ]),
    signCoverUrls(
      supabase,
      events.map((e) => e.cover_path),
    ),
  ]);

  const summaries = events.flatMap((e): EventSummary[] => {
    const host = profiles.get(e.creator_id);
    if (!host) return [];
    const rows = participants.filter((p) => p.event_id === e.id);
    const mine = rows.find((p) => p.user_id === me);
    return [
      {
        id: e.id,
        title: e.title,
        category: categoryFromId(e.category_id),
        coverUrl: e.cover_path ? (covers.get(e.cover_path) ?? null) : null,
        startsAt: e.starts_at,
        endsAt: e.ends_at,
        allDay: e.all_day,
        timezone: e.timezone,
        locationName: e.location_name,
        status: e.status,
        host,
        going: rows.filter((p) => p.rsvp === "going").flatMap((p) => profiles.get(p.user_id) ?? []),
        // Organizador → null. Participante → su respuesta. Amigo que lo ve por
        // visibilidad 'friends' y aún no se ha apuntado → pending.
        myRsvp: mine?.role === "host" || mine?.role === "cohost" ? null : (mine?.rsvp ?? "pending"),
        photoCount: photos.filter((p) => p.event_id === e.id).length,
      },
    ];
  });
  return { summaries, participants, profiles };
}

// Eventos en los que participo (salvo los que he rechazado).
async function myEventIds(supabase: ServerSupabaseClient, me: string) {
  const rows = unwrap(
    await supabase
      .from("event_participants")
      .select("event_id")
      .eq("user_id", me)
      .neq("rsvp", "not_going"),
  );
  return rows.map((r) => r.event_id);
}

export async function getUpcomingEvents(): Promise<EventSummary[]> {
  if (DESIGN_PREVIEW) {
    const [{ events }, now] = await Promise.all([loadMocks(), requestNow()]);
    return events
      .filter((e) => e.status === "scheduled" && new Date(e.startsAt) >= now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  const [me, supabase, now] = await Promise.all([
    getCurrentProfile(),
    createClient(),
    requestNow(),
  ]);
  const ids = await myEventIds(supabase, me.id);
  if (ids.length === 0) return [];

  // Siguen "próximos" mientras no hayan terminado (o 12 h si no tienen fin).
  const recent = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
  const events = unwrap(
    await supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .in("id", ids)
      .is("deleted_at", null)
      .eq("status", "scheduled")
      .or(`ends_at.gte.${now.toISOString()},starts_at.gte.${recent}`)
      .order("starts_at")
      .limit(50),
  );
  return (await hydrate(supabase, me.id, events)).summaries;
}

export async function getPendingRsvps(): Promise<EventSummary[]> {
  return (await getUpcomingEvents()).filter((e) => e.myRsvp === "pending");
}

export async function getEventsBetween(from: Date, to: Date): Promise<EventSummary[]> {
  if (DESIGN_PREVIEW) {
    const { events } = await loadMocks();
    return events.filter((e) => {
      const t = Date.parse(e.startsAt);
      return t >= from.getTime() && t < to.getTime() && e.status !== "cancelled";
    });
  }

  const [me, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const ids = await myEventIds(supabase, me.id);
  if (ids.length === 0) return [];
  const events = unwrap(
    await supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .in("id", ids)
      .is("deleted_at", null)
      .neq("status", "cancelled")
      .gte("starts_at", from.toISOString())
      .lt("starts_at", to.toISOString())
      .order("starts_at"),
  );
  return (await hydrate(supabase, me.id, events)).summaries;
}

// Ya empezados y sin cerrar, de los que soy organizador: pendientes de marcar
// como realizados (complete_event).
export async function getEventsToComplete(): Promise<EventSummary[]> {
  if (DESIGN_PREVIEW) {
    const [{ events }, now] = await Promise.all([loadMocks(), requestNow()]);
    return events.filter(
      (e) => e.status === "scheduled" && e.myRsvp === null && new Date(e.startsAt) <= now,
    );
  }

  const [me, supabase, now] = await Promise.all([
    getCurrentProfile(),
    createClient(),
    requestNow(),
  ]);
  const hosting = unwrap(
    await supabase
      .from("event_participants")
      .select("event_id")
      .eq("user_id", me.id)
      .in("role", ["host", "cohost"]),
  );
  if (hosting.length === 0) return [];
  const events = unwrap(
    await supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .in(
        "id",
        hosting.map((r) => r.event_id),
      )
      .is("deleted_at", null)
      .eq("status", "scheduled")
      .lte("starts_at", now.toISOString())
      .order("starts_at", { ascending: false })
      .limit(20),
  );
  return (await hydrate(supabase, me.id, events)).summaries;
}

// Resúmenes de unos eventos concretos (p. ej. los del historial), del más
// reciente al más antiguo. La RLS filtra los que no puedo ver.
export async function getEventSummaries(ids: string[]): Promise<EventSummary[]> {
  if (ids.length === 0) return [];
  const [me, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const events = unwrap(
    await supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .in("id", ids)
      .is("deleted_at", null)
      .order("starts_at", { ascending: false }),
  );
  return (await hydrate(supabase, me.id, events)).summaries;
}

export async function getEvent(id: string): Promise<EventDetail | null> {
  if (DESIGN_PREVIEW) return (await loadMocks()).eventDetail(id);

  const [me, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const { data: event } = await supabase
    .from("events")
    .select(EVENT_DETAIL_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!event) return null;

  const [{ summaries, participants, profiles }, peaks] = await Promise.all([
    hydrate(supabase, me.id, [event]),
    supabase
      .from("event_peaks")
      .select("elevation_gain_m, distance_km, peaks(id, name, altitude_m)")
      .eq("event_id", id)
      .then(unwrap),
  ]);
  const summary = summaries[0];
  if (!summary) return null;

  // Organizador primero; luego quien va, pendientes y quien no puede.
  const ORDER = { host: 0, cohost: 1, guest: 2 } as const;
  const RSVP_ORDER = { going: 0, pending: 1, not_going: 2 } as const;
  const list: EventParticipant[] = participants
    .flatMap((p) => {
      const profile = profiles.get(p.user_id);
      return profile ? [{ profile, role: p.role, rsvp: p.rsvp, attended: p.attended }] : [];
    })
    .sort(
      (a, b) =>
        ORDER[a.role] - ORDER[b.role] ||
        RSVP_ORDER[a.rsvp] - RSVP_ORDER[b.rsvp] ||
        a.profile.displayName.localeCompare(b.profile.displayName),
    );

  return {
    ...summary,
    description: event.description,
    extraInfo: event.extra_info,
    externalUrl: event.external_url,
    address: event.address,
    visibility: event.visibility,
    planId: event.plan_id,
    participants: list,
    peaks: peaks.flatMap(({ peaks: p, elevation_gain_m, distance_km }) =>
      p
        ? [
            {
              id: p.id,
              name: p.name,
              altitudeM: p.altitude_m,
              elevationGainM: elevation_gain_m,
              distanceKm: distance_km === null ? null : Number(distance_km),
            },
          ]
        : [],
    ),
    // TODO(Fase 6): galería (event_photos + signed URLs de las miniaturas).
    photos: [],
  };
}
