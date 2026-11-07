"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { createAction, unwrap } from "@/lib/action";
import { createClient } from "@/lib/supabase/server";

// Las reglas (solo el destinatario acepta, no a uno mismo…) las aplican las RPC
// y la RLS; aquí solo se valida la forma de la entrada.
const userSchema = z.object({ userId: z.uuid() });

export const sendFriendRequest = createAction(userSchema, async ({ userId }) => {
  const supabase = await createClient();
  const status = unwrap(await supabase.rpc("send_friend_request", { p_user: userId }));
  refresh();
  return status;
});

export const respondFriendRequest = createAction(
  userSchema.extend({ accept: z.boolean() }),
  async ({ userId, accept }) => {
    const supabase = await createClient();
    unwrap(await supabase.rpc("respond_friend_request", { p_user: userId, p_accept: accept }));
    refresh();
  },
);

// Eliminar a un amigo o cancelar una solicitud enviada.
export const removeFriend = createAction(userSchema, async ({ userId }) => {
  const supabase = await createClient();
  unwrap(await supabase.rpc("remove_friend", { p_user: userId }));
  refresh();
});
