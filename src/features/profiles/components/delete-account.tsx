"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteAccount } from "@/features/profiles/actions";
import { reportActionError } from "@/lib/form";

// Para evitar sustos, hay que escribir el propio username antes de eliminar.
export function DeleteAccount({ username }: { username: string }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const matches = confirm.trim().toLowerCase() === username;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setConfirm("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 data-icon="inline-start" />
          {t("settings.deleteAccount")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settings.deleteTitle")}</DialogTitle>
          <DialogDescription>{t("settings.deleteHint")}</DialogDescription>
        </DialogHeader>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          <li>{t("settings.deleteKeeps")}</li>
          <li>{t("settings.deleteCancels")}</li>
          <li>{t("settings.deleteRemoves")}</li>
        </ul>
        <label className="space-y-2 text-sm">
          <span className="block">
            {t.rich("settings.deleteConfirm", {
              username,
              b: (chunks) => <strong className="font-semibold">{chunks}</strong>,
            })}
          </span>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </label>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={pending}>
              {t("common.cancel")}
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!matches || pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteAccount({ confirm });
                if (result && !result.ok) reportActionError(result, t);
              })
            }
          >
            {pending && <Loader2 className="animate-spin" />}
            {t("settings.deleteSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
