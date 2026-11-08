import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/action";

type ActionFailure = Extract<ActionResult<unknown>, { ok: false }>;
type Translate = (key: string) => string;

// Errores de validación del servidor → en su campo (validation.<clave>);
// el resto → toast con errors.<código>. `overrides` traduce un código a un
// error de campo concreto (p. ej. conflict → username ya cogido).
export function reportActionError<T extends FieldValues>(
  result: ActionFailure,
  t: Translate,
  setError?: UseFormSetError<T>,
  overrides: Partial<Record<ActionFailure["error"], { field: Path<T>; message: string }>> = {},
) {
  const override = overrides[result.error];
  if (setError && override) {
    setError(override.field, { message: override.message }, { shouldFocus: true });
    return;
  }

  let shown = false;
  for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
    if (setError && messages?.[0]) {
      setError(field as Path<T>, { message: t(`validation.${messages[0]}`) });
      shown = true;
    }
  }
  if (!shown) toast.error(t(`errors.${result.error}`));
}

// Mensaje de un error de React Hook Form (clave de validation.* del esquema Zod).
export function fieldMessage(t: Translate, message?: string) {
  if (!message) return undefined;
  return message.includes(" ") ? message : t(`validation.${message}`);
}
