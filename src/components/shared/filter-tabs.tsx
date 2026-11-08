import Link from "next/link";

import { cn } from "@/lib/utils";

// Pestañas como enlaces (?f=…): el filtro forma parte de la URL y se puede compartir.
// La primera opción es la de por defecto y no se escribe en la URL. `query`
// conserva otros parámetros (p. ej. el mes de la agenda o el año del historial).
export function FilterTabs<T extends string>({
  options,
  value,
  param = "f",
  label,
  query,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  param?: string;
  label: string;
  query?: Record<string, string | null | undefined>;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "bg-card mb-6 inline-flex max-w-full overflow-x-auto rounded-full border p-1",
        className,
      )}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <Link
            key={o.value}
            href={hrefWith(query, param, i === 0 ? null : o.value)}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}

// `?a=1&b=2` con `param` cambiado (o quitado si es null).
export function hrefWith(
  query: Record<string, string | null | undefined> | undefined,
  param: string,
  value: string | null,
) {
  const params = new URLSearchParams();
  for (const [key, v] of Object.entries(query ?? {})) {
    if (v && key !== param) params.set(key, v);
  }
  if (value) params.set(param, value);
  const search = params.toString();
  return search ? `?${search}` : "?";
}
