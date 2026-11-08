import type { CategorySlug } from "@/features/categories/config";
import type { ProfileSummary } from "@/features/profiles/types";

export type Visibility = "private" | "invited" | "friends";
export type PlanStatus = "open" | "scheduled" | "done" | "archived";
export type PlanInterest = "pending" | "interested" | "not_interested";

export type PlanSummary = {
  id: string;
  title: string;
  category: CategorySlug;
  coverUrl: string | null;
  locationName: string | null;
  status: PlanStatus;
  visibility: Visibility;
  creator: ProfileSummary;
  interested: ProfileSummary[];
  invitedCount: number;
  myInterest: PlanInterest | null; // null si soy el creador
  createdAt: string;
};

export type PlanDetail = PlanSummary & {
  description: string | null;
  externalUrl: string | null;
  difficulty: number | null;
  address: string | null;
  peaks: { id: string; name: string; altitudeM: number }[];
  invitations: { profile: ProfileSummary; interest: PlanInterest }[];
  events: { id: string; startsAt: string; status: "scheduled" | "completed" | "cancelled" }[];
};
