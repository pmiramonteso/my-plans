import "server-only";

import { addDays, addHours, setHours, startOfDay, subDays } from "date-fns";
import { connection } from "next/server";

import type { CategorySlug } from "@/features/categories/config";
import type { EventDetail, EventSummary } from "@/features/events/types";
import type { Friend, FriendRequest } from "@/features/friends/types";
import type { AppNotification } from "@/features/notifications/types";
import type { PlanDetail, PlanSummary } from "@/features/plans/types";
import type { Profile, ProfileSummary } from "@/features/profiles/types";
import type { UserStats } from "@/features/stats/types";

// Datos de ejemplo para maquetar (Fase 2). Se sustituyen por consultas a
// Supabase en las fases 3–6; solo los usan los queries.ts de cada dominio.

const p = (id: string, username: string, displayName: string): ProfileSummary => ({
  id,
  username,
  displayName,
  avatarUrl: null,
});

export const ME: Profile = {
  ...p("u0", "alex", "Álex Serra"),
  bio: "Siempre con ganas de una cima más.",
  locale: "es",
  timezone: "Europe/Madrid",
};

const LAIA = p("u1", "laia", "Laia Puig");
const MARC = p("u2", "marc", "Marc Vidal");
const NURIA = p("u3", "nuria", "Núria Soler");
const JORDI = p("u4", "jordi", "Jordi Costa");
const ANA = p("u5", "ana", "Ana Martín");
const SERGI = p("u6", "sergi", "Sergi Roca");
const MARTA = p("u7", "marta_g", "Marta Gil");

export const PROFILES: Profile[] = [
  ME,
  ...[LAIA, MARC, NURIA, JORDI, ANA, SERGI, MARTA].map((f) => ({
    ...f,
    bio: null,
    locale: "es" as const,
    timezone: "Europe/Madrid",
  })),
];

const TZ = "Europe/Madrid";

// Fotos de ejemplo: degradados SVG en línea, sin peticiones externas.
function photo(id: string, hue: number, w = 1200, h = 900) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 35% 62%)"/><stop offset="1" stop-color="hsl(${hue + 30} 30% 32%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><path d="M0 ${h * 0.8} L${w * 0.3} ${h * 0.45} L${w * 0.5} ${h * 0.65} L${w * 0.72} ${h * 0.35} L${w} ${h * 0.75} V${h} H0Z" fill="hsl(${hue} 25% 22% / .55)"/></svg>`;
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  return { id, url, thumbUrl: url, width: w, height: h, uploader: null, canDelete: false };
}

export function buildMocks(now: Date) {
  const at = (days: number, hour: number) => setHours(startOfDay(addDays(now, days)), hour);

  const event = (
    id: string,
    title: string,
    category: CategorySlug,
    startsAt: Date,
    extra: Partial<EventSummary> = {},
  ): EventSummary => ({
    id,
    title,
    category,
    coverUrl: null,
    startsAt: startsAt.toISOString(),
    endsAt: null,
    allDay: false,
    timezone: TZ,
    locationName: null,
    status: startsAt < now ? "completed" : "scheduled",
    host: ME,
    going: [],
    myRsvp: null,
    photoCount: 0,
    ...extra,
  });

  const events: EventSummary[] = [
    event("e1", "Pica d'Estats", "summit", at(6, 7), {
      locationName: "Vall Ferrera, Pallars Sobirà",
      endsAt: addHours(at(6, 7), 11).toISOString(),
      going: [LAIA, MARC, NURIA],
      coverUrl: photo("c1", 150).url,
    }),
    event("e2", "Cena en Disfrutar", "restaurant", at(2, 21), {
      locationName: "Barcelona",
      host: LAIA,
      myRsvp: "pending",
      going: [LAIA, JORDI],
    }),
    event("e3", "Expo Sorolla en el MNAC", "museum", at(10, 11), {
      locationName: "MNAC, Montjuïc",
      host: NURIA,
      myRsvp: "going",
      going: [NURIA, ANA, ME],
    }),
    event("e4", "Fin de semana en Lisboa", "trip", at(24, 0), {
      allDay: true,
      endsAt: at(26, 0).toISOString(),
      locationName: "Lisboa",
      going: [MARC, SERGI],
      coverUrl: photo("c4", 200).url,
    }),
    event("e5", "Ruta de los Estanys de Colomers", "hiking", at(-12, 8), {
      locationName: "Val d'Aran",
      going: [LAIA, MARC, JORDI, ME],
      photoCount: 14,
      coverUrl: photo("c5", 160).url,
    }),
    event("e6", "Tarde en el Born", "city", at(-30, 17), {
      host: MARC,
      myRsvp: "going",
      going: [MARC, ME, ANA],
      photoCount: 3,
    }),
    event("e7", "Puigmal", "summit", at(-45, 7), {
      locationName: "Vall de Núria",
      going: [ME, SERGI, NURIA],
      photoCount: 22,
      coverUrl: photo("c7", 210).url,
    }),
  ];

  const plan = (
    id: string,
    title: string,
    category: CategorySlug,
    daysAgo: number,
    extra: Partial<PlanSummary> = {},
  ): PlanSummary => ({
    id,
    title,
    category,
    coverUrl: null,
    locationName: null,
    status: "open",
    visibility: "invited",
    creator: ME,
    interested: [],
    invitedCount: 0,
    myInterest: null,
    createdAt: subDays(now, daysAgo).toISOString(),
    ...extra,
  });

  const plans: PlanSummary[] = [
    plan("p1", "Aneto por La Renclusa", "summit", 3, {
      locationName: "Benasque",
      interested: [LAIA, MARC],
      invitedCount: 5,
      coverUrl: photo("pc1", 190).url,
    }),
    plan("p2", "Probar el ramen de Koku Kitchen", "restaurant", 1, {
      creator: JORDI,
      myInterest: "pending",
      locationName: "Barcelona",
      interested: [ANA],
      invitedCount: 4,
    }),
    plan("p3", "Ruta en kayak por la Costa Brava", "trip", 8, {
      creator: NURIA,
      myInterest: "interested",
      locationName: "Calella de Palafrugell",
      interested: [ME, SERGI, LAIA],
      invitedCount: 6,
      visibility: "friends",
    }),
    plan("p4", "Fundació Miró: nueva colección", "museum", 15, {
      locationName: "Montjuïc",
      interested: [NURIA],
      invitedCount: 3,
    }),
    plan("p5", "Camí de Ronda: Tossa → Sant Feliu", "hiking", 20, {
      creator: MARTA,
      myInterest: "not_interested",
      interested: [JORDI, ANA],
      invitedCount: 7,
    }),
    plan("p6", "Ascensión a la Pica d'Estats", "summit", 40, {
      status: "scheduled",
      interested: [LAIA, MARC, NURIA],
      invitedCount: 4,
    }),
  ];

  const eventDetail = (id: string): EventDetail | null => {
    const e = events.find((x) => x.id === id);
    if (!e) return null;
    const others = [LAIA, MARC, NURIA, JORDI].filter((f) => f.id !== e.host.id);
    return {
      ...e,
      description:
        "Salida temprano desde el parking de Areu. Ritmo tranquilo, con parada para comer en el refugio de Vallferrera.\n\nLlevad crampones por si hay neveros en la parte alta.",
      extraInfo: "Quedamos a las 6:30 en la gasolinera de la entrada del pueblo.",
      externalUrl: "https://es.wikiloc.com",
      address: e.locationName,
      visibility: "invited",
      planId: e.id === "e1" ? "p6" : null,
      participants: [
        { profile: e.host, role: "host", rsvp: "going", attended: e.status === "completed" },
        ...others.map((profile, i) => ({
          profile,
          role: "guest" as const,
          rsvp: (["going", "going", "pending", "not_going"] as const)[i % 4],
          attended: e.status === "completed" ? i < 2 : null,
        })),
      ],
      peaks:
        e.category === "summit"
          ? [{ id: "k1", name: e.title, altitudeM: 3143, elevationGainM: 1450, distanceKm: 16.2 }]
          : [],
      photos: Array.from({ length: Math.min(e.photoCount, 9) }, (_, i) =>
        photo(`${id}-ph${i}`, 140 + i * 17, i % 3 === 0 ? 900 : 1200, i % 3 === 0 ? 1200 : 900),
      ),
      canAddPhotos: e.status === "completed",
    };
  };

  const planDetail = (id: string): PlanDetail | null => {
    const pl = plans.find((x) => x.id === id);
    if (!pl) return null;
    const invited = [LAIA, MARC, NURIA, JORDI, ANA].filter((f) => f.id !== pl.creator.id);
    return {
      ...pl,
      description:
        "La idea es subir por el Portillón Superior y el glaciar. Haría falta material de alta montaña (crampones, piolet, casco). ¿Junio o julio?",
      externalUrl: "https://www.refugiolarenclusa.com",
      difficulty: 4,
      address: "Refugio de La Renclusa, Benasque",
      peaks: pl.category === "summit" ? [{ id: "k2", name: "Aneto", altitudeM: 3404 }] : [],
      invitations: invited.map((profile, i) => ({
        profile,
        interest: (["interested", "interested", "pending", "not_interested", "pending"] as const)[
          i
        ],
      })),
      events:
        pl.status === "scheduled"
          ? [{ id: "e1", startsAt: at(6, 7).toISOString(), status: "scheduled" }]
          : [],
    };
  };

  const friends: Friend[] = [
    { ...LAIA, sharedCount: 12 },
    { ...MARC, sharedCount: 9 },
    { ...NURIA, sharedCount: 7 },
    { ...JORDI, sharedCount: 4 },
    { ...ANA, sharedCount: 3 },
    { ...SERGI, sharedCount: 2 },
  ];

  const requests: FriendRequest[] = [
    { profile: MARTA, direction: "incoming", createdAt: subDays(now, 1).toISOString() },
    {
      profile: p("u8", "pau_r", "Pau Riera"),
      direction: "outgoing",
      createdAt: subDays(now, 4).toISOString(),
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: "n1",
      type: "event_invite",
      actor: LAIA,
      href: "/events/e2",
      data: { title: "Cena en Disfrutar" },
      readAt: null,
      createdAt: addHours(now, -2).toISOString(),
    },
    {
      id: "n2",
      type: "friend_request",
      actor: MARTA,
      href: "/friends/requests",
      data: {},
      readAt: null,
      createdAt: addHours(now, -20).toISOString(),
    },
    {
      id: "n3",
      type: "plan_interest",
      actor: MARC,
      href: "/plans/p1",
      data: { title: "Aneto por La Renclusa" },
      readAt: null,
      createdAt: subDays(now, 2).toISOString(),
    },
    {
      id: "n4",
      type: "photos_added",
      actor: JORDI,
      href: "/events/e5",
      data: { title: "Ruta de los Estanys de Colomers", count: 8 },
      readAt: subDays(now, 3).toISOString(),
      createdAt: subDays(now, 3).toISOString(),
    },
    {
      id: "n5",
      type: "event_rsvp",
      actor: NURIA,
      href: "/events/e1",
      data: { title: "Pica d'Estats" },
      readAt: subDays(now, 4).toISOString(),
      createdAt: subDays(now, 4).toISOString(),
    },
    {
      id: "n6",
      type: "event_completed",
      actor: SERGI,
      href: "/events/e7",
      data: { title: "Puigmal" },
      readAt: subDays(now, 40).toISOString(),
      createdAt: subDays(now, 44).toISOString(),
    },
  ];

  const stats: UserStats = {
    total: 27,
    byCategory: { hikes: 9, summits: 6, restaurants: 5, museums: 3, trips: 2, cities: 2 },
    distinctPeaks: 6,
    distinctPlaces: 19,
    elevationGainM: 8740,
    distanceKm: 162,
  };

  return { events, plans, eventDetail, planDetail, friends, requests, notifications, stats };
}

// Igual que una consulta real: depende de la petición, así que es dinámica y se
// renderiza detrás de <Suspense>.
export async function loadMocks() {
  await connection();
  return buildMocks(new Date());
}
