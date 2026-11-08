import { TZDate } from "@date-fns/tz";
import { addDays, format } from "date-fns";

// Fecha y hora "de pared" del formulario ↔ instantes (timestamptz) en la zona
// horaria del propio evento. Así "sábado a las 7:00" sigue siéndolo aunque quien
// lo mire esté en otra zona.

export type EventTimesInput = {
  date: string; // yyyy-MM-dd
  allDay: boolean;
  startTime?: string; // HH:mm
  endTime?: string;
  endDate?: string; // solo todo el día (varios días)
};

export type EventTimes = { startsAt: string; endsAt: string | null };

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

// TZDate.toISOString() conserva el desfase (+01:00); la BD y la app usan UTC.
const iso = (d: Date) => new Date(d.getTime()).toISOString();

function at(date: string, time: string, timeZone: string) {
  const [, y, m, d] = DATE.exec(date)!.map(Number);
  const [, hh, mm] = TIME.exec(time)!.map(Number);
  return new TZDate(y, m - 1, d, hh, mm, timeZone);
}

export type EventTimesError = "startTime" | "endTime" | "endDate";

// Devuelve los instantes o el campo con el error ("required" / "endBeforeStart").
export function toEventTimes(
  input: EventTimesInput,
  timeZone: string,
): { ok: true; times: EventTimes } | { ok: false; field: EventTimesError; error: string } {
  if (input.allDay) {
    const startsAt = at(input.date, "00:00", timeZone);
    if (!input.endDate || input.endDate === input.date) {
      return { ok: true, times: { startsAt: iso(startsAt), endsAt: null } };
    }
    // Fin = último instante del día final (23:59).
    const endsAt = at(input.endDate, "23:59", timeZone);
    if (endsAt < startsAt) return { ok: false, field: "endDate", error: "endBeforeStart" };
    return { ok: true, times: { startsAt: iso(startsAt), endsAt: iso(endsAt) } };
  }

  if (!input.startTime) return { ok: false, field: "startTime", error: "required" };
  const startsAt = at(input.date, input.startTime, timeZone);
  if (!input.endTime) return { ok: true, times: { startsAt: iso(startsAt), endsAt: null } };

  // Una hora de fin anterior a la de inicio se entiende como al día siguiente
  // (una cena que acaba a la 1:00).
  let endsAt = at(input.date, input.endTime, timeZone);
  if (endsAt <= startsAt) {
    endsAt = at(
      format(addDays(new TZDate(startsAt, timeZone), 1), "yyyy-MM-dd"),
      input.endTime,
      timeZone,
    );
  }
  return { ok: true, times: { startsAt: iso(startsAt), endsAt: iso(endsAt) } };
}

// Para prerrellenar el formulario de edición.
export function fromEventTimes(
  event: { startsAt: string; endsAt: string | null; allDay: boolean },
  timeZone: string,
): Required<Pick<EventTimesInput, "date" | "allDay">> & Omit<EventTimesInput, "date" | "allDay"> {
  const start = new TZDate(event.startsAt, timeZone);
  const end = event.endsAt ? new TZDate(event.endsAt, timeZone) : null;
  if (event.allDay) {
    return {
      date: format(start, "yyyy-MM-dd"),
      allDay: true,
      endDate: end ? format(end, "yyyy-MM-dd") : "",
    };
  }
  return {
    date: format(start, "yyyy-MM-dd"),
    allDay: false,
    startTime: format(start, "HH:mm"),
    endTime: end ? format(end, "HH:mm") : "",
  };
}
