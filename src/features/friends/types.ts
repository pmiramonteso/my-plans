import type { ProfileSummary } from "@/features/profiles/types";

export type FriendshipState = "none" | "friends" | "outgoing" | "incoming";

export type FriendRequest = {
  profile: ProfileSummary;
  direction: "incoming" | "outgoing";
  createdAt: string;
};

export type Friend = ProfileSummary & {
  sharedCount: number; // experiencias realizadas juntos
};
