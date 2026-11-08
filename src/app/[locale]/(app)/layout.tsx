import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile } from "@/features/profiles/queries";

export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <AppShell>
      <Suspense>
        <OnboardingGuard />
      </Suspense>
      {children}
    </AppShell>
  );
}

// Sin username, cualquier pantalla de la app manda a /onboarding. La lectura
// del perfil se comparte (cache) con el resto de componentes de la petición.
async function OnboardingGuard() {
  await getCurrentProfile();
  return null;
}
