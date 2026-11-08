"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmAction } from "@/components/shared/confirm-action";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { EventPhoto } from "@/features/events/types";
import { deletePhoto } from "@/features/photos/actions";

// Miniaturas en columnas; al pulsar, la foto grande con anterior/siguiente
// (también con las flechas del teclado) y, si puedo, eliminar.
export function PhotoGallery({ photos, title }: { photos: EventPhoto[]; title: string }) {
  const t = useTranslations("photos");
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? null : photos[index];

  const go = (step: number) =>
    setIndex((i) => (i === null ? i : (i + step + photos.length) % photos.length));

  return (
    <>
      <ul className="columns-2 gap-2 sm:columns-3 [&>li]:mb-2">
        {photos.map((photo, i) => (
          <li key={photo.id} className="break-inside-avoid overflow-hidden rounded-xl">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t("open", { index: i + 1, total: photos.length })}
              className="focus-visible:ring-ring/50 block w-full overflow-hidden rounded-xl focus-visible:ring-3 focus-visible:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbUrl}
                alt=""
                width={photo.width}
                height={photo.height}
                loading="lazy"
                className="bg-muted h-auto w-full transition duration-300 hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={current !== null} onOpenChange={(open) => !open && setIndex(null)}>
        {current && (
          <DialogContent
            className="max-h-[calc(100dvh-2rem)] gap-3 p-2 sm:max-w-5xl sm:p-3"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") go(-1);
              if (e.key === "ArrowRight") go(1);
            }}
          >
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("open", { index: (index ?? 0) + 1, total: photos.length })}
            </DialogDescription>
            <div className="bg-muted relative flex items-center justify-center overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={current.id}
                src={current.url}
                alt=""
                width={current.width}
                height={current.height}
                className="max-h-[calc(100dvh-8rem)] w-auto object-contain"
                style={{ backgroundImage: `url(${current.thumbUrl})`, backgroundSize: "cover" }}
              />
              {photos.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 rounded-full opacity-90"
                    onClick={() => go(-1)}
                    aria-label={t("previous")}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 rounded-full opacity-90"
                    onClick={() => go(1)}
                    aria-label={t("next")}
                  >
                    <ChevronRight />
                  </Button>
                </>
              )}
            </div>
            <div className="flex min-h-9 items-center gap-2 px-1 pr-10 text-sm">
              {current.uploader && (
                <>
                  <UserAvatar profile={current.uploader} size="xs" />
                  <span className="text-muted-foreground min-w-0 flex-1 truncate">
                    {t("by", { name: current.uploader.displayName })}
                  </span>
                </>
              )}
              <span className="text-muted-foreground ml-auto tabular-nums">
                {(index ?? 0) + 1} / {photos.length}
              </span>
              {current.canDelete && (
                <ConfirmAction
                  trigger={
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 data-icon="inline-start" />
                      {t("delete")}
                    </Button>
                  }
                  title={t("deleteTitle")}
                  description={t("deleteHint")}
                  confirmLabel={t("delete")}
                  action={async () => {
                    const result = await deletePhoto({ id: current.id });
                    if (result.ok)
                      setIndex(photos.length > 1 ? (index ?? 0) % (photos.length - 1) : null);
                    return result;
                  }}
                />
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
