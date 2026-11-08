import { FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";

// Aviso temporal de la Fase 2: las pantallas muestran datos de ejemplo.
export function DemoNotice() {
  const t = useTranslations("common");
  return (
    <p className="bg-warning/15 text-foreground mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
      <FlaskConical aria-hidden className="size-3.5 shrink-0" />
      {t("demoNotice")}
    </p>
  );
}
