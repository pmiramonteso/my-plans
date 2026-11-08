import type { EventSummary } from "@/features/events/types";

// Filtro de la agenda en la URL (?f=…). "all" es el de por defecto.
export const AGENDA_FILTERS = ["all", "going", "pending", "hosting"] as const;
export type AgendaFilter = (typeof AGENDA_FILTERS)[number];

export function parseAgendaFilter(value: unknown): AgendaFilter {
  return AGENDA_FILTERS.find((f) => f === value) ?? "all";
}

// myRsvp es null cuando organizo yo.
export function matchesAgendaFilter(event: Pick<EventSummary, "myRsvp">, filter: AgendaFilter) {
  switch (filter) {
    case "going":
      return event.myRsvp === "going";
    case "pending":
      return event.myRsvp === "pending";
    case "hosting":
      return event.myRsvp === null;
    default:
      return true;
  }
}

// ?m=2026-11 → primer día de ese mes; si no es válido, null (mes actual).
export function parseMonthParam(value: unknown): { year: number; month: number } | null {
  const match = typeof value === "string" && /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  return match ? { year: Number(match[1]), month: Number(match[2]) - 1 } : null;
}
