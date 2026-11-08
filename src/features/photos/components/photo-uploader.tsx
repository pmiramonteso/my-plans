"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { addPhotos } from "@/features/photos/actions";
import { MAX_PHOTOS_PER_UPLOAD } from "@/features/photos/schemas";
import { uploadEventPhotos } from "@/features/photos/upload";
import { reportActionError } from "@/lib/form";
import { cn } from "@/lib/utils";

// Elige varias fotos, las comprime en el navegador y las sube. Al terminar,
// addPhotos las registra de una vez (una sola notificación para el resto).
export function PhotoUploader({
  eventId,
  variant = "outline",
  className,
}: {
  eventId: string;
  variant?: "default" | "outline";
  className?: string;
}) {
  const t = useTranslations();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = progress !== null || pending;

  async function upload(list: FileList | null) {
    // Sin filtrar por tipo: algunos navegadores dan HEIC con type vacío. Lo que
    // no se pueda decodificar falla en la compresión y se cuenta como fallida.
    let files = [...(list ?? [])];
    if (input.current) input.current.value = ""; // permite volver a elegir las mismas
    if (files.length === 0) return;
    if (files.length > MAX_PHOTOS_PER_UPLOAD) {
      toast.warning(t("photos.tooMany", { max: MAX_PHOTOS_PER_UPLOAD }));
      files = files.slice(0, MAX_PHOTOS_PER_UPLOAD);
    }

    setProgress({ done: 0, total: files.length });
    const { uploaded, failed } = await uploadEventPhotos(eventId, files, (done) =>
      setProgress({ done, total: files.length }),
    );
    setProgress(null);
    if (failed > 0) toast.error(t("photos.failed", { count: failed }));
    if (uploaded.length === 0) return;

    startTransition(async () => {
      const result = await addPhotos({ eventId, photos: uploaded });
      if (!result.ok) return reportActionError(result, t);
      toast.success(t("photos.uploaded", { count: result.data.count }));
    });
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => upload(e.target.files)}
      />
      <Button
        type="button"
        variant={variant}
        className={cn("w-full", className)}
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? <Loader2 className="animate-spin" /> : <ImagePlus data-icon="inline-start" />}
        <span aria-live="polite">
          {progress
            ? t("photos.uploading", { done: progress.done, total: progress.total })
            : pending
              ? t("photos.saving")
              : t("events.addPhotos")}
        </span>
      </Button>
    </>
  );
}
