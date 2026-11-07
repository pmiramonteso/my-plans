import Link from "next/link";

import { cn } from "@/lib/utils";

// Pestañas como enlaces (?f=…): el filtro forma parte de la URL y se puede compartir.
export function FilterTabs<T extends string>({
  options,
  value,
  param = "f",
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  param?: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="bg-card mb-6 inline-flex rounded-full border p-1">
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <Link
            key={o.value}
            href={i === 0 ? "?" : `?${param}=${o.value}`}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
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
