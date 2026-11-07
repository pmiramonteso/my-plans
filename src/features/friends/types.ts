import type { ProfileSummary } from "@/features/profiles/types";

// Relación con otra persona vista desde el usuario con sesión.
export type FriendshipState = "none" | "friends" | "outgoing" | "incoming";

export type FriendRequest = {
  profile: ProfileSummary;
  direction: "incoming" | "outgoing";
  createdAt: string;
};

export type Friend = ProfileSummary & {
  sharedCount: number; // experiencias realizadas juntos
};

export type SearchResult = {
  profile: ProfileSummary;
  state: FriendshipState;
};
