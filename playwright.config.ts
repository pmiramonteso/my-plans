import { defineConfig, devices } from "@playwright/test";

import { localSupabase } from "./e2e/support/supabase";

// E2E contra la versión de producción de la app (puerto 3100, para no chocar
// con `npm run dev`) y el Supabase local (`npm run db:start`). Los usuarios se
// crean con email y contraseña solo para las pruebas y se borran al acabar; en
// producción el único acceso es Google.
const supabase = localSupabase();
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabase.url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabase.publishableKey,
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
