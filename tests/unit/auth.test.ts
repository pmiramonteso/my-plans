import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/features/auth/redirect";

describe("safeNextPath", () => {
  it("acepta rutas internas con query", () => {
    expect(safeNextPath("/agenda?m=2026-11")).toBe("/agenda?m=2026-11");
    expect(safeNextPath("/events/123")).toBe("/events/123");
  });

  it("rechaza redirecciones a otros dominios", () => {
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("javascript:alert(1)")).toBe("/");
    expect(safeNextPath("/\nevil")).toBe("/");
  });

  it("usa el inicio si no hay valor", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });
});
