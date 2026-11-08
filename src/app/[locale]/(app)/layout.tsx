import { AppShell } from "@/components/layout/app-shell";

// TODO(Fase 3): comprobar el onboarding (username) del perfil detrás de <Suspense>.
export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return <AppShell>{children}</AppShell>;
}
