"use client";

import { useOptimistic, useTransition } from "react";
import { Check, ChevronDown, Clock, UserCheck, UserMinus, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { removeFriend, respondFriendRequest, sendFriendRequest } from "@/features/friends/actions";
import type { FriendshipState } from "@/features/friends/types";
import type { ActionResult } from "@/lib/action";
import { reportActionError } from "@/lib/form";

// Una sola pieza para todos los estados de la relación. El estado se actualiza
// al instante (optimista) y el action refresca la página con el valor real.
export function FriendshipButton({
  userId,
  state,
  size = "sm",
}: {
  userId: string;
  state: FriendshipState;
  size?: "sm" | "default";
}) {
  const t = useTranslations();
  const [shown, setShown] = useOptimistic(state);
  const [pending, startTransition] = useTransition();

  const run = (next: FriendshipState, action: () => Promise<ActionResult<unknown>>) =>
    startTransition(async () => {
      setShown(next);
      const result = await action();
      if (!result.ok) reportActionError(result, t);
    });

  switch (shown) {
    case "none":
      return (
        <Button
          size={size}
          disabled={pending}
          onClick={() => run("outgoing", () => sendFriendRequest({ userId }))}
        >
          <UserPlus data-icon="inline-start" />
          {t("friends.add")}
        </Button>
      );

    case "outgoing":
      return (
        <Button
          size={size}
          variant="outline"
          disabled={pending}
          onClick={() => run("none", () => removeFriend({ userId }))}
        >
          <Clock data-icon="inline-start" />
          {t("friends.pending")} · {t("friends.cancelRequest")}
        </Button>
      );

    case "incoming":
      return (
        <div className="flex gap-2">
          <Button
            size={size}
            disabled={pending}
            onClick={() => run("friends", () => respondFriendRequest({ userId, accept: true }))}
          >
            <Check data-icon="inline-start" />
            {t("friends.accept")}
          </Button>
          <Button
            size={size}
            variant="ghost"
            disabled={pending}
            onClick={() => run("none", () => respondFriendRequest({ userId, accept: false }))}
          >
            <X data-icon="inline-start" />
            {t("friends.decline")}
          </Button>
        </div>
      );

    case "friends":
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size={size} variant="secondary" disabled={pending}>
              <UserCheck data-icon="inline-start" />
              {t("nav.friends")}
              <ChevronDown data-icon="inline-end" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => run("none", () => removeFriend({ userId }))}
            >
              <UserMinus /> {t("friends.remove")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
  }
}
