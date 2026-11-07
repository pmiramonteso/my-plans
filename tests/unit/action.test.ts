import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("next/navigation", () => ({ unstable_rethrow: () => {} }));

const { AppError, createAction, mapDbError, unwrap } = await import("@/lib/action");

describe("mapDbError", () => {
  it("reconoce los códigos lanzados por la BD", () => {
    expect(mapDbError({ code: "P0001", message: "event_closed" })).toBe("event_closed");
    expect(mapDbError({ code: "42501", message: "not_friends" })).toBe("not_friends");
  });

  it("traduce los SQLSTATE genéricos", () => {
    expect(
      mapDbError({ code: "42501", message: "new row violates row-level security policy" }),
    ).toBe("forbidden");
    expect(mapDbError({ code: "23505" })).toBe("conflict");
    expect(mapDbError({ code: "23514" })).toBe("invalid_input");
    expect(mapDbError({ code: "PGRST116" })).toBe("not_found");
    expect(mapDbError({ code: "XX000" })).toBe("unknown");
    expect(mapDbError(null)).toBe("unknown");
  });
});

describe("unwrap", () => {
  it("devuelve los datos o lanza AppError", () => {
    expect(unwrap({ data: 1, error: null })).toBe(1);
    expect(() => unwrap({ data: null, error: { code: "42501" } })).toThrow(AppError);
  });
});

describe("createAction", () => {
  const schema = z.object({ title: z.string().min(1) });

  it("valida la entrada antes de ejecutar", async () => {
    const handler = vi.fn();
    const result = await createAction(schema, handler)({ title: "" });
    expect(result).toMatchObject({ ok: false, error: "invalid_input" });
    expect(result.ok === false && result.fieldErrors?.title).toBeTruthy();
    expect(handler).not.toHaveBeenCalled();
  });

  it("devuelve el resultado del handler", async () => {
    const result = await createAction(schema, async ({ title }) => title.toUpperCase())({
      title: "aneto",
    });
    expect(result).toEqual({ ok: true, data: "ANETO" });
  });

  it("no expone errores internos", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fail = createAction(schema, async () => {
      throw new Error("connection string leaked");
    });
    expect(await fail({ title: "x" })).toEqual({ ok: false, error: "unknown" });
    spy.mockRestore();
  });

  it("propaga los AppError como código", async () => {
    const fail = createAction(schema, async () => {
      throw new AppError("forbidden");
    });
    expect(await fail({ title: "x" })).toEqual({ ok: false, error: "forbidden" });
  });
});
