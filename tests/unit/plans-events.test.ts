import { describe, expect, it } from "vitest";

import { eventFormSchema, eventSchema } from "@/features/events/schemas";
import { planCoverSchema, planSchema } from "@/features/plans/schemas";

const A = "3f1c2b4a-8d6e-4f7a-9b2c-1d3e5f7a9b0c";
const B = "7a9e0c1d-2b3f-4a5c-8d6e-9f0a1b2c3d4e";

const plan = {
  title: "  Aneto  ",
  category: "summit",
  description: "",
  location: "Benasque",
  link: "",
  difficulty: "4",
  visibility: "invited",
  invitees: [A, A, B],
} as const;

describe("planSchema", () => {
  it("normaliza: textos vacíos a null, dificultad a número, invitados sin duplicados", () => {
    expect(planSchema.parse(plan)).toEqual({
      title: "Aneto",
      category: "summit",
      description: null,
      location: "Benasque",
      link: null,
      difficulty: 4,
      visibility: "invited",
      invitees: [A, B],
    });
  });

  it("un único checkbox marcado (string) o ninguno (false) se convierten en lista", () => {
    expect(planSchema.parse({ ...plan, invitees: A }).invitees).toEqual([A]);
    expect(planSchema.parse({ ...plan, invitees: false }).invitees).toEqual([]);
  });

  it("una propuesta privada descarta los invitados", () => {
    expect(planSchema.parse({ ...plan, visibility: "private" }).invitees).toEqual([]);
  });

  it("solo acepta enlaces http(s)", () => {
    const issue = (link: string) =>
      planSchema.safeParse({ ...plan, link }).error?.issues[0]?.message;
    expect(issue("javascript:alert(1)")).toBe("url");
    expect(issue("www.ejemplo.com")).toBe("url");
    expect(planSchema.parse({ ...plan, link: "https://wikiloc.com/x" }).link).toBe(
      "https://wikiloc.com/x",
    );
  });

  it("la portada debe estar en la carpeta de su propuesta", () => {
    expect(planCoverSchema.safeParse({ id: A, path: `plans/${A}/${B}.webp` }).success).toBe(true);
    expect(planCoverSchema.safeParse({ id: A, path: `plans/${B}/${B}.webp` }).success).toBe(false);
    expect(planCoverSchema.safeParse({ id: A, path: `events/${A}/${B}.webp` }).success).toBe(false);
  });
});

const event = {
  title: "Pica d'Estats",
  category: "summit",
  description: "",
  extraInfo: "",
  location: "",
  link: "",
  date: "2026-11-14",
  allDay: false,
  startTime: "07:00",
  endTime: "18:00",
  endDate: "",
  visibility: "invited",
  invitees: [B],
  timezone: "Europe/Madrid",
} as const;

describe("eventSchema", () => {
  it("calcula los instantes en la zona del evento", () => {
    expect(eventSchema.parse(event)).toMatchObject({
      startsAt: "2026-11-14T06:00:00.000Z",
      endsAt: "2026-11-14T17:00:00.000Z",
      invitees: [B],
    });
  });

  it("marca el campo de la hora si falta", () => {
    const r = eventFormSchema.safeParse({ ...event, startTime: "" });
    expect(r.error?.issues[0]).toMatchObject({ path: ["startTime"], message: "required" });
  });

  it("rechaza una zona horaria inventada", () => {
    expect(eventSchema.safeParse({ ...event, timezone: "Mars/Base" }).success).toBe(false);
  });
});
