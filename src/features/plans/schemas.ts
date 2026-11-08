import { z } from "zod";

import { CATEGORY_SLUGS } from "@/features/categories/config";
import { optionalText, optionalUrl, requiredText, uuidList } from "@/lib/validation";

// Igual que los CHECK de public.plans.
export const planFieldsSchema = z.object({
  title: requiredText(120),
  category: z.enum(CATEGORY_SLUGS, "required"),
  description: optionalText(5000),
  location: optionalText(200),
  link: optionalUrl,
  // Radios: "1".."5" o nada.
  difficulty: z
    .enum(["1", "2", "3", "4", "5"])
    .nullish()
    .transform((v) => (v ? Number(v) : null)),
  visibility: z.enum(["private", "invited", "friends"]),
  invitees: uuidList,
});

// Una propuesta privada no tiene invitados: si se marcaron antes de cambiar la
// visibilidad, se descartan (la RPC create_plan también lo impide).
const dropPrivateInvitees = <T extends z.infer<typeof planFieldsSchema>>(p: T): T =>
  p.visibility === "private" ? { ...p, invitees: [] } : p;

export const planSchema = planFieldsSchema.transform(dropPrivateInvitees);

export const updatePlanSchema = planFieldsSchema
  .extend({ id: z.uuid() })
  .transform(dropPrivateInvitees);

export const planInterestSchema = z.object({
  planId: z.uuid(),
  interest: z.enum(["interested", "not_interested"]),
});

export const planIdSchema = z.object({ id: z.uuid() });

// covers/plans/{plan_id}/{uuid}.webp
export const planCoverSchema = z
  .object({ id: z.uuid(), path: z.string() })
  .refine((v) => new RegExp(`^plans/${v.id}/[0-9a-f-]{36}\\.webp$`).test(v.path), {
    path: ["path"],
    message: "invalid",
  });

export type PlanFormValues = z.input<typeof planSchema>;
export type PlanFormOutput = z.output<typeof planSchema>;
