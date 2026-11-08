import { describe, expect, it } from "vitest";

import { fromEventTimes, toEventTimes } from "@/features/events/dates";

const MADRID = "Europe/Madrid";

describe("toEventTimes", () => {
  it("interpreta fecha y hora en la zona del evento (horario de invierno)", () => {
    expect(toEventTimes({ date: "2026-11-14", allDay: false, startTime: "07:00" }, MADRID)).toEqual(
      {
        ok: true,
        times: { startsAt: "2026-11-14T06:00:00.000Z", endsAt: null },
      },
    );
  });

  it("respeta el horario de verano", () => {
    const r = toEventTimes(
      { date: "2026-07-04", allDay: false, startTime: "07:00", endTime: "18:00" },
      MADRID,
    );
    expect(r).toEqual({
      ok: true,
      times: { startsAt: "2026-07-04T05:00:00.000Z", endsAt: "2026-07-04T16:00:00.000Z" },
    });
  });

  it("una hora de fin anterior se entiende como al día siguiente", () => {
    const r = toEventTimes(
      { date: "2026-11-14", allDay: false, startTime: "21:00", endTime: "01:00" },
      MADRID,
    );
    expect(r.ok && r.times.endsAt).toBe("2026-11-15T00:00:00.000Z");
  });

  it("sin hora de inicio es un error del campo", () => {
    expect(toEventTimes({ date: "2026-11-14", allDay: false }, MADRID)).toEqual({
      ok: false,
      field: "startTime",
      error: "required",
    });
  });

  it("todo el día: desde medianoche hasta el final del último día", () => {
    expect(
      toEventTimes({ date: "2026-12-01", allDay: true, endDate: "2026-12-03" }, MADRID),
    ).toEqual({
      ok: true,
      times: { startsAt: "2026-11-30T23:00:00.000Z", endsAt: "2026-12-03T22:59:00.000Z" },
    });
    expect(
      toEventTimes({ date: "2026-12-03", allDay: true, endDate: "2026-12-01" }, MADRID),
    ).toMatchObject({ ok: false, field: "endDate", error: "endBeforeStart" });
  });
});

describe("fromEventTimes", () => {
  it("es la inversa de toEventTimes", () => {
    const input = { date: "2026-07-04", allDay: false, startTime: "07:00", endTime: "18:00" };
    const r = toEventTimes(input, MADRID);
    if (!r.ok) throw new Error("esperaba ok");
    expect(fromEventTimes({ ...r.times, allDay: false }, MADRID)).toEqual(input);
  });

  it("todo el día con varios días", () => {
    const r = toEventTimes({ date: "2026-12-01", allDay: true, endDate: "2026-12-03" }, MADRID);
    if (!r.ok) throw new Error("esperaba ok");
    expect(fromEventTimes({ ...r.times, allDay: true }, MADRID)).toEqual({
      date: "2026-12-01",
      allDay: true,
      endDate: "2026-12-03",
    });
  });
});
