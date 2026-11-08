"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { createAction, unwrap } from "@/lib/action";
import { createClient } from "@/lib/supabase/server";

// Solo se puede tocar read_at de las propias (grant update (read_at) + RLS).
export const markNotificationRead = createAction(z.object({ id: z.uuid() }), async ({ id }) => {
  const supabase = await createClient();
  unwrap(
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .is("read_at", null),
  );
  refresh();
});

export const markAllNotificationsRead = createAction(z.object({}), async () => {
  const supabase = await createClient();
  const count = unwrap(await supabase.rpc("mark_all_notifications_read"));
  refresh();
  return { count };
});
