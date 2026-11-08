"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { LOCALE_COOKIE } from "@/i18n/config";
import { AppError, createAction, unwrap } from "@/lib/action";
import { createClient } from "@/lib/supabase/server";

import { getSessionProfile } from "./queries";
import { avatarSchema, localeSchema, onboardingSchema, profileSchema } from "./schemas";

const AVATAR_BUCKET = "avatars";

async function currentUserId() {
  const profile = await getSessionProfile();
  return profile.id;
}

export const completeOnboarding = createAction(onboardingSchema, async (input) => {
  const supabase = await createClient();
  const id = await currentUserId();
  unwrap(
    await supabase
      .from("profiles")
      .update({
        username: input.username,
        display_name: input.displayName,
        ...(input.timezone && { timezone: input.timezone }),
      })
      .eq("id", id),
  );
  redirect("/");
});

export const updateProfile = createAction(profileSchema, async (input) => {
  const supabase = await createClient();
  const id = await currentUserId();
  unwrap(
    await supabase
      .from("profiles")
      .update({ username: input.username, display_name: input.displayName, bio: input.bio || null })
      .eq("id", id),
  );
  refresh();
});

// El idioma vive en el perfil y en la cookie que lee el proxy.
export const setLocale = createAction(localeSchema, async ({ locale }) => {
  const supabase = await createClient();
  const id = await currentUserId();
  unwrap(await supabase.from("profiles").update({ locale }).eq("id", id));
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  refresh();
});

// El cliente ya ha subido la foto (comprimida) a avatars/{id}/…; aquí se guarda
// su URL pública y se borra la anterior si también era nuestra.
export const setAvatar = createAction(avatarSchema, async ({ path }) => {
  const supabase = await createClient();
  const profile = await getSessionProfile();
  if (!path.startsWith(`${profile.id}/`)) throw new AppError("forbidden");

  const storage = supabase.storage.from(AVATAR_BUCKET);
  const { publicUrl } = storage.getPublicUrl(path).data;
  unwrap(await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id));

  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const previous = profile.avatarUrl?.split(marker)[1];
  if (previous && previous !== path && previous.startsWith(`${profile.id}/`)) {
    await storage.remove([previous]); // si falla, solo queda un archivo huérfano
  }
  refresh();
});

// Eliminar la cuenta: se borra el avatar y la RPC anonimiza el perfil, borra
// los datos personales de auth y bloquea el acceso. Lo compartido (eventos
// realizados, propuestas y fotos) se conserva en el historial de los amigos.
// Para confirmar hay que escribir el propio username.
export const deleteAccount = createAction(
  z.object({ confirm: z.string().trim().toLowerCase() }),
  async ({ confirm }) => {
    const [supabase, profile] = await Promise.all([createClient(), getSessionProfile()]);
    if (!profile.username || confirm !== profile.username) throw new AppError("invalid_input");

    const storage = supabase.storage.from(AVATAR_BUCKET);
    const { data: files } = await storage.list(profile.id);
    if (files?.length) await storage.remove(files.map((f) => `${profile.id}/${f.name}`));

    unwrap(await supabase.rpc("delete_my_account"));
    // Las sesiones ya no existen en la BD: solo queda borrar las cookies.
    await supabase.auth.signOut({ scope: "local" });
    redirect("/login?deleted=1");
  },
);
