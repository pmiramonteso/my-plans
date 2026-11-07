"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";

// La búsqueda vive en la URL (?q=): la renderiza el servidor con search_profiles
// y se puede compartir o volver atrás. Se espera a que el usuario deje de escribir.
export function SearchBox({ label }: { label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const update = (next: string) => {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const q = next.trim();
      startTransition(() =>
        router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, {
          scroll: false,
        }),
      );
    }, 300);
  };

  return (
    <form role="search" className="relative" onSubmit={(e) => e.preventDefault()}>
      <Search
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
      />
      <Input
        type="search"
        name="q"
        value={value}
        onChange={(e) => update(e.target.value)}
        aria-label={label}
        placeholder={label}
        autoComplete="off"
        className="bg-card h-12 rounded-full pr-10 pl-10"
      />
      {pending && (
        <Loader2
          aria-hidden
          className="text-muted-foreground absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin"
        />
      )}
    </form>
  );
}
