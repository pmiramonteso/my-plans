import { expect, test } from "./support/fixtures";

// Fecha de ayer en Madrid (AAAA-MM-DD): el evento ya ha empezado y se puede cerrar.
function yesterday() {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(d);
}

test("propuesta → interés → evento → asistencia → historial compartido", async ({
  createUser,
  makeFriends,
  pageAs,
}) => {
  const [ana, bea] = await Promise.all([createUser("ana"), createUser("bea")]);
  await makeFriends(ana, bea);
  const title = `Pedraforca ${Date.now().toString(36)}`;

  // Ana lanza una propuesta e invita a Bea.
  const anaPage = await pageAs(ana);
  await anaPage.goto("/create/plan");
  await anaPage.getByLabel("Título").fill(title);
  await anaPage.getByRole("radiogroup", { name: "Categoría" }).getByText("Senderismo").click();
  // El selector de amigos muestra el nombre de pila.
  const beaCheckbox = (page: typeof anaPage) => page.getByRole("checkbox", { name: "Bea" });
  // Como una persona: se pulsa el nombre (el checkbox real está oculto).
  await anaPage
    .locator("label")
    .filter({ has: beaCheckbox(anaPage) })
    .click();
  await expect(beaCheckbox(anaPage)).toBeChecked();
  await anaPage.getByRole("button", { name: "Publicar propuesta" }).click();
  await expect(anaPage).toHaveURL(/\/plans\/[0-9a-f-]{36}$/);
  const planUrl = new URL(anaPage.url()).pathname;
  await expect(anaPage.getByRole("heading", { level: 1 })).toHaveText(title);

  // Bea recibe la invitación y se apunta.
  const beaPage = await pageAs(bea);
  await beaPage.goto("/notifications");
  await expect(beaPage.getByText(title)).toBeVisible();
  await beaPage.goto(planUrl);
  await beaPage.getByRole("button", { name: "Me apunto" }).click();
  await expect(beaPage.getByRole("button", { name: "Me apunto" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Ana organiza la propuesta (ayer, para poder cerrarla): Bea viene marcada.
  await anaPage.goto(`${planUrl}/schedule`);
  await anaPage.getByLabel("Fecha").fill(yesterday());
  await anaPage.getByLabel("Hora de inicio").fill("09:00");
  await expect(beaCheckbox(anaPage)).toBeChecked();
  await anaPage.getByRole("button", { name: "Crear evento" }).click();
  await expect(anaPage).toHaveURL(/\/events\/[0-9a-f-]{36}$/);
  const eventUrl = new URL(anaPage.url()).pathname;

  // Bea confirma que va.
  await beaPage.goto(eventUrl);
  await beaPage.getByRole("button", { name: "Voy" }).click();
  await expect(beaPage.getByRole("button", { name: "Voy" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Ana marca el evento como realizado: las dos asistieron.
  await anaPage.goto(eventUrl);
  await anaPage.getByRole("link", { name: "Marcar como realizado" }).click();
  await expect(anaPage).toHaveURL(`${eventUrl}/complete`);
  await expect(anaPage.getByText("2 asistentes")).toBeVisible();
  await anaPage.getByRole("button", { name: "Confirmar asistencia" }).click();
  await expect(anaPage).toHaveURL(eventUrl);
  await expect(anaPage.getByText("Realizado").first()).toBeVisible();

  // Aparece en el historial de Bea y en el compartido con Ana.
  await beaPage.goto("/history");
  await expect(beaPage.getByText(title)).toBeVisible();
  await beaPage.goto(`/history/with/${ana.username}`);
  await expect(beaPage.getByText(title)).toBeVisible();
});

test("un desconocido no ve la propuesta de otro", async ({ createUser, pageAs }) => {
  const [ana, intruso] = await Promise.all([createUser("ana"), createUser("intruso")]);
  const anaPage = await pageAs(ana);
  await anaPage.goto("/create/plan");
  await anaPage.getByLabel("Título").fill("Plan secreto");
  await anaPage.getByRole("radiogroup", { name: "Categoría" }).getByText("Museo").click();
  await anaPage.getByRole("button", { name: "Publicar propuesta" }).click();
  await expect(anaPage).toHaveURL(/\/plans\/[0-9a-f-]{36}$/);

  const intrusoPage = await pageAs(intruso);
  await intrusoPage.goto(new URL(anaPage.url()).pathname);
  await expect(intrusoPage.getByRole("heading", { name: "Por aquí no hay camino" })).toBeVisible();
  await expect(intrusoPage.getByText("Plan secreto")).toHaveCount(0);
});
