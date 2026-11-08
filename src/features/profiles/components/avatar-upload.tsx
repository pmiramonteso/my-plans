"use client";

import { useRef, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { setAvatar } from "@/features/profiles/actions";
import type { ProfileSummary } from "@/features/profiles/types";
import { reportActionError } from "@/lib/form";
import { resizeToWebp } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";

const ACCEPT = "image/jpeg,image/png,image/webp";

// Se comprime en el navegador (512 px, WebP) y se sube directamente a Storage
// con la sesión del usuario; la política del bucket solo deja escribir en su carpeta.
export function AvatarUpload({ profile }: { profile: ProfileSummary }) {
  const t = useTranslations();
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const upload = (file: File) =>
    startTransition(async () => {
      try {
        const blob = await resizeToWebp(file, { maxSize: 512, square: true });
        const path = `${profile.id}/${crypto.randomUUID()}.webp`;
        const { error } = await createClient()
          .storage.from("avatars")
          .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw error;

        const result = await setAvatar({ path });
        if (!result.ok) reportActionError(result, t);
      } catch (error) {
        console.error("[avatar]", error);
        toast.error(t("settings.avatarError"));
      }
    });

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <UserAvatar profile={profile} size="lg" />
        {pending && (
          <span className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-full">
            <Loader2 className="size-5 animate-spin" />
          </span>
        )}
      </div>
      <div className="space-y-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => input.current?.click()}
        >
          <Camera data-icon="inline-start" />
          {t("settings.avatar")}
        </Button>
        <p className="text-muted-foreground text-xs">{t("settings.avatarHint")}</p>
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />
    </div>
  );
}
