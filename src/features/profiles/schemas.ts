import { z } from "zod";

import { LOCALES } from "@/i18n/config";

// Los mensajes son claves de messages/*.json → validation.<clave>; el mismo
// esquema valida en el cliente (React Hook Form) y en el Server Action.
// La BD repite las reglas con CHECK (profiles).

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, "username");

export const displayNameSchema = z.string().trim().min(1, "required").max(80, "tooLong");

export const timezoneSchema = z
  .string()
  .refine((tz) => Intl.supportedValuesOf("timeZone").includes(tz), "invalid");

export const onboardingSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  timezone: timezoneSchema.optional(),
});

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  bio: z.string().trim().max(280, "tooLong"),
});

export const localeSchema = z.object({ locale: z.enum(LOCALES) });

// avatars/{user_id}/{uuid}.webp (la ruta la genera el cliente al subir).
export const avatarSchema = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/, "invalid"),
});

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
