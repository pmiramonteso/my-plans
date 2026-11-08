"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// Botón temporal (Fase 2) para acciones que aún no tienen Server Action.
// TODO: cada uso se sustituye por su Server Action (amistad en la Fase 3, etc.).
export function DemoButton(props: Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const t = useTranslations("common");
  return <Button {...props} onClick={() => toast(t("demoAction"))} />;
}
