import { describe, expect, it } from "vitest";

import { decodeCursor, encodeCursor, notificationHref } from "@/features/notifications/links";

const ID = "3f1c2b4a-8d6e-4f7a-9b2c-1d3e5f7a9b0c";

describe("notificaciones", () => {
  it("cada tipo lleva a su pantalla", () => {
    expect(notificationHref("friend_request", "profile", ID, "laia")).toBe("/friends/requests");
    expect(notificationHref("friend_accepted", "profile", ID, "laia")).toBe("/u/laia");
    expect(notificationHref("friend_accepted", "profile", ID, null)).toBe("/friends");
    expect(notificationHref("plan_invite", "plan", ID, null)).toBe(`/plans/${ID}`);
    expect(notificationHref("photos_added", "event", ID, null)).toBe(`/events/${ID}`);
  });

  it("el cursor de la paginación va y vuelve por la URL", () => {
    const cursor = { createdAt: "2026-11-08T21:41:06.123456+00:00", id: ID };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
    expect(decodeCursor(`2026-11-08T21:41:06Z_${ID}`)).toEqual({
      createdAt: "2026-11-08T21:41:06Z",
      id: ID,
    });
  });

  it("rechaza cursores manipulados", () => {
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor(["x"])).toBeNull();
    expect(decodeCursor(`2026-11-08_${ID}`)).toBeNull();
    expect(decodeCursor(`2026-11-08T21:41:06Z_${ID}),id.gt.(0`)).toBeNull();
    expect(decodeCursor("2026-11-08T21:41:06Z_not-a-uuid")).toBeNull();
  });
});
