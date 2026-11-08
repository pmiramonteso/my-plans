import { expect, test } from "./support/fixtures";

test("sin sesión, la app lleva al login y conserva adónde ibas", async ({ page }) => {
  await page.goto("/agenda");
  await expect(page).toHaveURL(/\/login\?next=%2Fagenda/);
  await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
});

test("con sesión se ve el inicio con el saludo", async ({ createUser, pageAs }) => {
  const ana = await createUser("ana");
  const page = await pageAs(ana);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ana");
});

test("sin username, la app pide terminar el onboarding", async ({ createUser, pageAs }) => {
  const nuevo = await createUser("nuevo");
  // Simula a alguien que acaba de entrar con Google: aún no tiene username.
  const { createClient } = await import("@supabase/supabase-js");
  const { localSupabase } = await import("./support/supabase");
  const { url, secretKey } = localSupabase();
  await createClient(url, secretKey).from("profiles").update({ username: null }).eq("id", nuevo.id);

  const page = await pageAs(nuevo);
  await page.goto("/agenda");
  await expect(page).toHaveURL(/\/onboarding/);
});
