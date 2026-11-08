import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

// Códigos de error que la BD lanza (`raise exception '<codigo>'`) más los genéricos.
// Cada código tiene su traducción en messages/*.json → errors.<codigo>.
export const APP_ERROR_CODES = [
  "not_authenticated",
  "forbidden",
  "not_found",
  "not_friends",
  "invalid_input",
  "plan_closed",
  "event_closed",
  "event_not_started",
  "conflict",
  "unknown",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: AppErrorCode; fieldErrors?: Record<string, string[] | undefined> };

export class AppError extends Error {
  constructor(public readonly code: AppErrorCode) {
    super(code);
    this.name = "AppError";
  }
}

type DbError = { code?: string; message?: string } | null | undefined;

export function mapDbError(error: DbError): AppErrorCode {
  if (!error) return "unknown";
  const known = APP_ERROR_CODES.find((c) => c === error.message);
  if (known) return known;

  switch (error.code) {
    case "42501": // RLS o privilegio de columna
      return "forbidden";
    case "23505": // unique_violation
      return "conflict";
    case "23503": // foreign_key_violation
    case "23514": // check_violation
    case "22023": // invalid_parameter_value
    case "22P02": // invalid_text_representation
      return "invalid_input";
    case "PGRST116": // .single() sin filas
    case "P0002":
      return "not_found";
    default:
      return "unknown";
  }
}

// Devuelve los datos o lanza un AppError ya traducido a código de la app.
// Sin error, PostgREST siempre trae `data` (los tipos de supabase-js no lo
// estrechan); en las RPC que devuelven void es null.
export function unwrap<T>({ data, error }: { data: T | null; error: DbError }): T {
  if (error) throw new AppError(mapDbError(error));
  return data as T;
}

// Envoltorio para Server Actions: valida con Zod, captura errores y nunca
// expone detalles internos al cliente.
export function createAction<S extends z.ZodType, T>(
  schema: S,
  handler: (input: z.infer<S>) => Promise<T>,
) {
  return async (rawInput: z.input<S>): Promise<ActionResult<T>> => {
    const parsed = schema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        ok: false,
        error: "invalid_input",
        fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
          string,
          string[] | undefined
        >,
      };
    }

    try {
      return { ok: true, data: await handler(parsed.data) };
    } catch (error) {
      unstable_rethrow(error); // redirect(), notFound()…
      if (error instanceof AppError) return { ok: false, error: error.code };
      console.error("[action]", error);
      return { ok: false, error: "unknown" };
    }
  };
}
