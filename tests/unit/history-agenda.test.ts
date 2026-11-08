import { describe, expect, it } from "vitest";

import { hrefWith } from "@/components/shared/filter-tabs";
import { matchesAgendaFilter, parseAgendaFilter, parseMonthParam } from "@/features/agenda/filters";
import { completeEventSchema } from "@/features/events/schemas";
import {
  applyHistoryFilter,
  eventYear,
  parseHistoryFilter,
  sharedRows,
  type HistoryRow,
} from "@/features/history/filters";

const A = "3f1c2b4a-8d6e-4f7a-9b2c-1d3e5f7a9b0c";
const B = "7a9e0c1d-2b3f-4a5c-8d6e-9f0a1b2c3d4e";

const row = (eventId: string, userId: string, startsAt: string, category = "hiking") =>
  ({ eventId, userId, startsAt, timezone: "Europe/Madrid", category }) as HistoryRow;

describe("completeEventSchema", () => {
  it("exige al menos un asistente y quita duplicados", () => {
    expect(completeEventSchema.parse({ id: A, attendees: [B, B] }).attendees).toEqual([B]);
    const empty = completeEventSchema.safeParse({ id: A, attendees: [] });
    expect(empty.success).toBe(false);
    expect(empty.error?.issues[0]).toMatchObject({
      path: ["attendees"],
      message: "attendeesRequired",
    });
  });
});

describe("historial", () => {
  it("lee el filtro de la URL e ignora valores inválidos", () => {
    expect(parseHistoryFilter({ y: "2025", c: "summit" })).toEqual({
      year: 2025,
      category: "summit",
    });
    expect(parseHistoryFilter({ y: "25", c: "volcano" })).toEqual({ year: null, category: null });
    expect(parseHistoryFilter({ y: ["2025"] })).toEqual({ year: null, category: null });
  });

  it("el año es el de la zona del evento", () => {
    // 31/12 23:30 UTC es ya 1 de enero en Madrid.
    expect(eventYear("2025-12-31T23:30:00Z", "Europe/Madrid")).toBe(2026);
    expect(eventYear("2025-12-31T23:30:00Z", "UTC")).toBe(2025);
  });

  it("compartido: solo eventos a los que asistieron todos", () => {
    const rows = [
      row("e1", "me", "2025-05-01T08:00:00Z"),
      row("e1", "ana", "2025-05-01T08:00:00Z"),
    ];
    rows.push(row("e2", "me", "2025-06-01T08:00:00Z"));
    expect(sharedRows(rows, ["me", "ana"]).map((r) => r.eventId)).toEqual(["e1"]);
    expect(sharedRows(rows, ["me"]).map((r) => r.eventId)).toEqual(["e1", "e2"]);
  });

  it("filtra por año y categoría y calcula las opciones", () => {
    const rows = [
      row("e1", "me", "2024-03-01T08:00:00Z", "museum"),
      row("e2", "me", "2025-05-01T08:00:00Z", "summit"),
      row("e3", "me", "2025-06-01T08:00:00Z", "hiking"),
    ];
    expect(applyHistoryFilter(rows, { year: null, category: null })).toEqual({
      eventIds: ["e1", "e2", "e3"],
      years: [2025, 2024],
      categories: ["hiking", "summit", "museum"],
    });
    // Las categorías son las del año elegido.
    expect(applyHistoryFilter(rows, { year: 2025, category: "summit" })).toEqual({
      eventIds: ["e2"],
      years: [2025, 2024],
      categories: ["hiking", "summit"],
    });
    // Un año sin datos sigue apareciendo para poder quitarlo.
    expect(applyHistoryFilter(rows, { year: 2019, category: null }).years).toEqual([
      2025, 2024, 2019,
    ]);
  });
});

describe("agenda", () => {
  it("filtra por mi respuesta (null = organizo)", () => {
    expect(parseAgendaFilter("hosting")).toBe("hosting");
    expect(parseAgendaFilter("x")).toBe("all");
    expect(matchesAgendaFilter({ myRsvp: null }, "hosting")).toBe(true);
    expect(matchesAgendaFilter({ myRsvp: "going" }, "hosting")).toBe(false);
    expect(matchesAgendaFilter({ myRsvp: "pending" }, "pending")).toBe(true);
    expect(matchesAgendaFilter({ myRsvp: "not_going" }, "all")).toBe(true);
  });

  it("lee el mes de la URL", () => {
    expect(parseMonthParam("2026-11")).toEqual({ year: 2026, month: 10 });
    expect(parseMonthParam("2026-13")).toBeNull();
    expect(parseMonthParam(undefined)).toBeNull();
  });

  it("los enlaces de filtro conservan los otros parámetros", () => {
    expect(hrefWith({ m: "2026-11", f: "going" }, "f", null)).toBe("?m=2026-11");
    expect(hrefWith({ m: "2026-11", f: null }, "f", "pending")).toBe("?m=2026-11&f=pending");
    expect(hrefWith({ y: "2025" }, "y", null)).toBe("?");
  });
});
