import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// Piezas comunes de las páginas de detalle (propuesta y evento).

export function DetailHero({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mx-4 mb-6 overflow-hidden sm:mx-0 sm:rounded-3xl [&>*]:aspect-[16/9] [&>*]:w-full sm:[&>*]:aspect-[21/8]">
      {children}
    </div>
  );
}

export function Panel({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("bg-card rounded-2xl border p-4 sm:p-5", className)}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Fact({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Icon aria-hidden className="text-primary mt-0.5 size-5 shrink-0" />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

// Texto libre del usuario: respeta saltos de línea, nunca HTML.
export function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-3 leading-relaxed text-pretty">
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="whitespace-pre-line">
          {para}
        </p>
      ))}
    </div>
  );
}
