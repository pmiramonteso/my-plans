import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { localSupabase } from "./supabase";

export type TestUser = {
  id: string;
  email: string;
  password: string;
  username: string;
  displayName: string;
};

type Fixtures = {
  // Crea un usuario con el onboarding hecho (se borra al acabar la prueba).
  createUser: (name: string) => Promise<TestUser>;
  makeFriends: (a: TestUser, b: TestUser) => Promise<void>;
  // Página con la sesión de ese usuario (cookies de @supabase/ssr).
  pageAs: (user: TestUser) => Promise<Page>;
};

const admin = () => {
  const { url, secretKey } = localSupabase();
  return createClient(url, secretKey, { auth: { persistSession: false } });
};

export const test = base.extend<Fixtures>({
  createUser: async ({}, use, testInfo) => {
    const created: string[] = [];
    await use(async (name) => {
      const tag = `${testInfo.workerIndex}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      const username = `${name}_${tag}`.toLowerCase().slice(0, 20);
      const email = `${username}@e2e.test`;
      // Aleatoria en cada ejecución, para un usuario local que se borra al acabar.
      const password = `e2e-${crypto.randomUUID()}`; // ggignore
      const displayName = `${name[0].toUpperCase()}${name.slice(1)} E2E`;
      const { data, error } = await admin().auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: displayName },
      });
      if (error) throw error;
      created.push(data.user.id);
      const { error: profileError } = await admin()
        .from("profiles")
        .update({ username, timezone: "Europe/Madrid", locale: "es" })
        .eq("id", data.user.id);
      if (profileError) throw profileError;
      return { id: data.user.id, email, password, username, displayName };
    });
    for (const id of created) await admin().auth.admin.deleteUser(id);
  },

  makeFriends: async ({}, use) => {
    await use(async (a, b) => {
      const [userA, userB] = [a.id, b.id].sort();
      const { error } = await admin()
        .from("friendships")
        .insert({ user_a: userA, user_b: userB, requested_by: a.id, status: "accepted" });
      if (error) throw error;
    });
  },

  pageAs: async ({ browser, baseURL }, use) => {
    const contexts: BrowserContext[] = [];
    await use(async (user) => {
      const context = await browser.newContext({
        baseURL,
        locale: "es-ES",
        timezoneId: "Europe/Madrid",
      });
      contexts.push(context);
      await context.addCookies(await sessionCookies(user, new URL(baseURL!).hostname));
      return context.newPage();
    });
    for (const context of contexts) await context.close();
  },
});

// Inicia sesión con email y contraseña y devuelve las cookies tal como las
// escribe @supabase/ssr (mismo nombre y formato que usa la app).
async function sessionCookies(user: TestUser, domain: string) {
  const { url, publishableKey } = localSupabase();
  const jar = new Map<string, string>();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) jar.set(name, value);
      },
    },
  });
  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw error;
  return [...jar].map(([name, value]) => ({
    name,
    value,
    domain,
    path: "/",
    sameSite: "Lax" as const,
  }));
}

export { expect } from "@playwright/test";
