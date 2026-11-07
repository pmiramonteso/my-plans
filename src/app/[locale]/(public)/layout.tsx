import { Logo } from "@/components/layout/logo";

// Pantallas sin sesión (login): sin navegación, con un fondo de cordilleras.
export default function PublicLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <header className="relative z-10 p-6">
        <Logo />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-40">
        {children}
      </main>
      <span
        aria-hidden
        className="bg-accent/70 pointer-events-none absolute right-[18%] bottom-44 size-14 rounded-full sm:bottom-56 sm:size-16"
      />
      <Ridges />
    </div>
  );
}

function Ridges() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-56 w-full sm:h-72"
    >
      <path
        d="M0 220 L180 120 L320 190 L520 70 L700 180 L860 110 L1040 200 L1220 90 L1440 170 V320 H0Z"
        className="fill-primary/10"
      />
      <path
        d="M0 260 L220 170 L400 240 L600 150 L780 250 L980 160 L1180 240 L1440 190 V320 H0Z"
        className="fill-primary/20"
      />
      <path
        d="M0 300 L260 230 L480 290 L720 220 L960 290 L1200 240 L1440 280 V320 H0Z"
        className="fill-primary/35"
      />
    </svg>
  );
}
