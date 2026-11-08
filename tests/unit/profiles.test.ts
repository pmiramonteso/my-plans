import { describe, expect, it } from "vitest";

import {
  avatarSchema,
  onboardingSchema,
  profileSchema,
  usernameSchema,
} from "@/features/profiles/schemas";

const issue = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues[0]?.message;

describe("usernameSchema", () => {
  it("normaliza a minúsculas y sin espacios", () => {
    expect(usernameSchema.parse("  Laia_P ")).toBe("laia_p");
  });

  it("aplica el mismo formato que el CHECK de la BD", () => {
    expect(issue(usernameSchema.safeParse("ab"))).toBe("username");
    expect(issue(usernameSchema.safeParse("a".repeat(21)))).toBe("username");
    expect(issue(usernameSchema.safeParse("laia.puig"))).toBe("username");
    expect(usernameSchema.safeParse("laia_99").success).toBe(true);
  });
});

describe("onboardingSchema", () => {
  it("exige nombre y acepta solo zonas horarias válidas", () => {
    expect(issue(onboardingSchema.safeParse({ username: "laia", displayName: "  " }))).toBe(
      "required",
    );
    expect(
      onboardingSchema.safeParse({
        username: "laia",
        displayName: "Laia",
        timezone: "Europe/Madrid",
      }).success,
    ).toBe(true);
    expect(
      issue(
        onboardingSchema.safeParse({
          username: "laia",
          displayName: "Laia",
          timezone: "Mars/Base",
        }),
      ),
    ).toBe("invalid");
  });
});

describe("profileSchema", () => {
  it("limita la bio a 280 caracteres", () => {
    const base = { username: "laia", displayName: "Laia" };
    expect(profileSchema.safeParse({ ...base, bio: "x".repeat(280) }).success).toBe(true);
    expect(issue(profileSchema.safeParse({ ...base, bio: "x".repeat(281) }))).toBe("tooLong");
  });
});

describe("avatarSchema", () => {
  const id = "00000000-0000-0000-0000-0000000000a1";
  it("solo acepta {user_id}/{uuid}.webp", () => {
    expect(avatarSchema.safeParse({ path: `${id}/${id}.webp` }).success).toBe(true);
    expect(avatarSchema.safeParse({ path: `../${id}.webp` }).success).toBe(false);
    expect(avatarSchema.safeParse({ path: `${id}/${id}.png` }).success).toBe(false);
  });
});
