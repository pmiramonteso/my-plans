import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-heading flex items-center gap-2 rounded-md text-xl font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark className="size-8" />
      my-plans
    </Link>
  );
}

// Dos cimas y un sol: el plan compartido.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <circle cx="22" cy="10" r="3.5" className="fill-accent" />
      <path
        d="M4 25 L12 13 L16.5 19 L19.5 15.5 L28 25 Z"
        className="fill-primary-foreground"
        strokeLinejoin="round"
      />
    </svg>
  );
}
