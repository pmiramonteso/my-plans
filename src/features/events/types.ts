import type { CategorySlug } from "@/features/categories/config";
import type { Visibility } from "@/features/plans/types";
import type { ProfileSummary } from "@/features/profiles/types";

export type EventStatus = "scheduled" | "completed" | "cancelled";
export type RsvpStatus = "pending" | "going" | "not_going";

export type EventSummary = {
  id: string;
  title: string;
  category: CategorySlug;
  coverUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  timezone: string;
  locationName: string | null;
  status: EventStatus;
  host: ProfileSummary;
  going: ProfileSummary[];
  myRsvp: RsvpStatus | null; // null si soy el organizador
  photoCount: number;
};

export type EventParticipant = {
  profile: ProfileSummary;
  role: "host" | "cohost" | "guest";
  rsvp: RsvpStatus;
  attended: boolean | null;
};

export type EventDetail = EventSummary & {
  description: string | null;
  extraInfo: string | null;
  externalUrl: string | null;
  address: string | null;
  visibility: Visibility;
  planId: string | null;
  participants: EventParticipant[];
  peaks: {
    id: string;
    name: string;
    altitudeM: number;
    elevationGainM: number | null;
    distanceKm: number | null;
  }[];
  photos: { id: string; url: string; width: number; height: number }[];
};
