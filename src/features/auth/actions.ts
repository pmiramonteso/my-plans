"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import { safeNextPath } from "./redirect";

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  // El origen de la petición sirve también en los despliegues de vista previa;
  // Supabase solo acepta las URLs de su lista de redirecciones permitidas.
  const origin = (await headers()).get("origin") ?? env.NEXT_PUBLIC_SITE_URL;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data.url) {
    console.error("[auth] signInWithOAuth", error);
    redirect("/login?error=auth");
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
