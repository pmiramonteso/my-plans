import { z } from "zod";

import { CATEGORY_SLUGS } from "@/features/categories/config";
import { timezoneSchema } from "@/features/profiles/schemas";
import { optionalText, optionalUrl, requiredText, uuidList } from "@/lib/validation";

import { toEventTimes } from "./dates";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const eventFieldsSchema = z.object({
  title: requiredText(120),
  category: z.enum(CATEGORY_SLUGS, "required"),
  description: optionalText(5000),
  extraInfo: optionalText(5000),
  location: optionalText(200),
  link: optionalUrl,
  date: z.string().regex(DATE, "required"),
  allDay: z.boolean(),
  startTime: z.union([z.literal(""), z.string().regex(TIME, "invalid")]).optional(),
  endTime: z.union([z.literal(""), z.string().regex(TIME, "invalid")]).optional(),
  endDate: z.union([z.literal(""), z.string().regex(DATE, "invalid")]).optional(),
  visibility: z.enum(["invited", "friends"]),
  invitees: uuidList,
  timezone: timezoneSchema,
});

// Fecha y hora → instantes en la zona del evento (o error en su campo).
function withTimes<T extends z.infer<typeof eventFieldsSchema>>(value: T, ctx: z.RefinementCtx) {
  const result = toEventTimes(value, value.timezone);
  if (!result.ok) {
    ctx.addIssue({ code: "custom", path: [result.field], message: result.error });
    return z.NEVER;
  }
  return { ...value, ...result.times };
}

// En el cliente solo se valida (sin transformar): mismos errores de fecha.
export const eventFormSchema = eventFieldsSchema.superRefine((value, ctx) => {
  const result = toEventTimes(value, value.timezone);
  if (!result.ok) ctx.addIssue({ code: "custom", path: [result.field], message: result.error });
});

export const eventSchema = eventFieldsSchema
  .extend({ planId: z.uuid().optional() })
  .transform(withTimes);

export const updateEventSchema = eventFieldsSchema.extend({ id: z.uuid() }).transform(withTimes);

export const rsvpSchema = z.object({
  eventId: z.uuid(),
  rsvp: z.enum(["going", "not_going"]),
});

export const eventIdSchema = z.object({ id: z.uuid() });

// covers/events/{event_id}/{uuid}.webp
export const eventCoverSchema = z
  .object({ id: z.uuid(), path: z.string() })
  .refine((v) => new RegExp(`^events/${v.id}/[0-9a-f-]{36}\\.webp$`).test(v.path), {
    path: ["path"],
    message: "invalid",
  });

export type EventFormValues = z.input<typeof eventFormSchema>;
export type EventFormOutput = z.output<typeof eventFormSchema>;
