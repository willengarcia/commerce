import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const key = "platun.privacy-consent";
function choice(analytics: boolean, age = 0, version = "1.0.0") {
  const now = Date.now() - age;
  return {
    version,
    necessary: true,
    analytics,
    advertising: false,
    decidedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 180 * 86400000).toISOString(),
  };
}
async function seed(page: Page, value: unknown) {
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key, value },
  );
}
async function network(context: BrowserContext, fail = false) {
  const requests: string[] = [];
  // Never transmit fixture data to Microsoft. Exercise the real NPM loader,
  // replace the remote tag with a recorder that survives SPA until document unload.
  await context.route(
    /https:\/\/([^/]*\.)?(clarity\.ms|bing\.com)\//,
    async (route) => {
      requests.push(route.request().url());
      if (fail) return route.abort();
      if (route.request().url().includes("/tag/"))
        return route.fulfill({
          contentType: "application/javascript",
          body: `
      window.__clarityCommands = Array.from(window.clarity?.q || [], x => Array.from(x));
      window.clarity = (...args) => window.__clarityCommands.push(args);
      document.cookie = '_clck=fixture; Path=/';
      document.cookie = '_clsk=fixture; Path=/';
      setInterval(() => fetch('https://www.clarity.ms/collect?fixture=1', {method:'POST', body:location.href}).catch(() => {}), 150);
    `,
        });
      if (route.request().method() === "POST") {
        const recorded = new URL(route.request().postData()!);
        expect(recorded.search).toBe("");
        expect(recorded.hash).toBe("");
        expect(recorded.pathname).toMatch(
          /^(\/|\/privacy-policy|\/search|\/product\/\d+|\/search\/category\/\d+)$/,
        );
      }
      return route.fulfill({ status: 204, body: "" });
    },
  );
  return requests;
}
async function loaded(page: Page) {
  await expect(page.locator("h1").first()).toBeVisible();
}
async function accept(page: Page) {
  await page
    .getByRole("button", { name: "Aceitar análise", exact: true })
    .click();
  await expect(page.locator("#clarity-script")).toHaveCount(1);
}

test("popup X persists refusal and fits mobile and desktop", async ({
  page,
  context,
}) => {
  const requests = await network(context);
  await page.goto("/privacy-policy");
  const popup = page.getByTestId("consent-popup");
  await expect(popup).toBeVisible();
  for (const size of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(size);
    const box = await popup.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(size.height);
    expect(await popup.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/privacy-popup-mobile.png" });
  await page.getByRole("button", { name: "Fechar e recusar análise" }).click();
  await expect(popup).toHaveCount(0);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).analytics,
      key,
    ),
  ).toBe(false);
  await page.reload();
  await loaded(page);
  await expect(popup).toHaveCount(0);
  expect(requests).toEqual([]);
});

test("Escape also refuses optional analysis", async ({ page, context }) => {
  const requests = await network(context);
  await page.goto("/privacy-policy");
  await expect(page.getByTestId("consent-popup")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("consent-popup")).toHaveCount(0);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).analytics,
      key,
    ),
  ).toBe(false);
  expect(requests).toEqual([]);
});

test("no Clarity network before consent; refusal persists after reload", async ({
  page,
  context,
}) => {
  const requests = await network(context);
  await page.goto("/privacy-policy");
  await loaded(page);
  await expect(
    page.getByText("Sua privacidade é importante para nós"),
  ).toBeVisible();
  await page.waitForTimeout(1200);
  expect(requests).toEqual([]);
  await page
    .getByRole("button", { name: "Recusar opcionais", exact: true })
    .click();
  await page.reload();
  await loaded(page);
  await page.waitForTimeout(1200);
  expect(requests).toEqual([]);
  await expect(page.locator("#clarity-script")).toHaveCount(0);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).analytics,
      key,
    ),
  ).toBe(false);
});
test("acceptance uses Consent V2 with advertising denied and initializes once", async ({
  page,
  context,
}) => {
  const requests = await network(context);
  await page.goto("/privacy-policy");
  await accept(page);
  await expect
    .poll(() => requests.filter((x) => x.includes("/tag/")).length)
    .toBe(1);
  await page.waitForTimeout(1200);
  const commands = await page.evaluate(() => (window as any).__clarityCommands);
  expect(commands).toContainEqual([
    "consentv2",
    { analytics_Storage: "granted", ad_Storage: "denied" },
  ]);
  expect(requests.filter((x) => x.includes("/tag/")).length).toBe(1);
  await page.reload();
  await expect(page.locator("#clarity-script")).toHaveCount(1);
  expect(await page.locator("body").getAttribute("data-clarity-mask")).toBe(
    "true",
  );
});
test("revocation unloads the recorder, removes accessible cookies and stays denied", async ({
  page,
  context,
}) => {
  const requests = await network(context);
  await page.goto("/privacy-policy");
  await accept(page);
  await expect
    .poll(async () => (await context.cookies()).some((c) => c.name === "_clck"))
    .toBe(true);
  await page
    .getByRole("button", { name: "Preferências de privacidade", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Recusar opcionais", exact: true })
    .click();
  await expect(page.locator("#clarity-script")).toHaveCount(0);
  await page.waitForTimeout(300);
  const count = requests.length;
  await page.waitForTimeout(1200);
  expect(requests.length).toBe(count);
  expect(
    (await context.cookies()).filter((c) =>
      ["_clck", "_clsk"].includes(c.name),
    ),
  ).toEqual([]);
});
test("revocation synchronizes between tabs", async ({ page, context }) => {
  await network(context);
  await page.goto("/privacy-policy");
  await accept(page);
  const other = await context.newPage();
  await other.goto("/privacy-policy");
  await expect(other.locator("#clarity-script")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Preferências de privacidade", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Recusar opcionais", exact: true })
    .click();
  await expect(other.locator("#clarity-script")).toHaveCount(0);
  await other.close();
});
test("expired, previous-version and corrupt storage do not load the tag", async ({
  browser,
}) => {
  for (const value of [
    choice(true, 181 * 86400000),
    choice(true, 0, "0.9.0"),
    { analytics: true },
  ]) {
    const context = await browser.newContext();
    const requests = await network(context);
    const page = await context.newPage();
    await seed(page, value);
    await page.goto("http://localhost:3108/privacy-policy");
    await expect(
      page.getByText("Sua privacidade é importante para nós"),
    ).toBeVisible();
    expect(requests).toEqual([]);
    await context.close();
  }
});
test("storage failure and failed SDK download do not break navigation", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const requests = await network(context);
  const page = await context.newPage();
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("disabled");
      },
    }),
  );
  await page.goto("http://localhost:3108/privacy-policy");
  await page
    .getByRole("button", { name: "Aceitar análise", exact: true })
    .click();
  expect(requests).toEqual([]);
  await expect(page.locator("#clarity-script")).toHaveCount(0);
  await context.close();
  const failed = await browser.newContext();
  await network(failed, true);
  const p = await failed.newPage();
  await p.goto("http://localhost:3108/privacy-policy");
  await accept(p);
  await p.getByRole("link", { name: "Entrar", exact: true }).click();
  await expect(p).toHaveURL(/\/login$/);
  await failed.close();
});
test("private routes and URLs with personal query text never load Clarity", async ({
  page,
  context,
}) => {
  const requests = await network(context);
  await seed(page, choice(true));
  for (const route of [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password?token=fixture",
    "/account",
    "/checkout",
    "/cart",
    "/account/orders/1/payment",
    "/admin",
    "/search?q=private",
    "/?email=private",
    "/privacy-policy#private",
  ]) {
    await page.goto(route);
    await page.waitForTimeout(300);
    await expect(page.locator("#clarity-script")).toHaveCount(0);
  }
  expect(requests).toEqual([]);
});
test("public to account and cart uses a fresh document, no surviving recorder", async ({
  page,
  context,
}) => {
  await network(context);
  await page.goto("/privacy-policy");
  await accept(page);
  await page.evaluate(() => ((window as any).__oldDocument = true));
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => (window as any).__oldDocument),
  ).toBeUndefined();
  await expect(page.locator("#clarity-script")).toHaveCount(0);
  await page.goto("/privacy-policy");
  await expect(page.locator("#clarity-script")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Abrir carrinho", exact: true })
    .click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(
    page.getByRole("heading", { name: "Meu carrinho", exact: true }).last(),
  ).toBeVisible();
  await expect(page.locator("#clarity-script")).toHaveCount(0);
});
test("authenticated public browsing is excluded", async ({ page, context }) => {
  const requests = await network(context);
  await context.addCookies([
    {
      name: "ecommerce_session",
      value: "fixture",
      domain: "localhost",
      path: "/",
      httpOnly: true,
    },
  ]);
  await seed(page, choice(true));
  await page.goto("/privacy-policy");
  await loaded(page);
  await page.waitForTimeout(1200);
  expect(requests).toEqual([]);
});
test("mobile banner and keyboard-accessible preferences fit the viewport", async ({
  page,
  context,
}) => {
  await network(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/privacy-policy");
  await page
    .getByRole("button", { name: "Gerenciar preferências", exact: true })
    .click();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(
    page.getByRole("heading", {
      name: "Preferências de privacidade",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", {
      name: "Preferências de privacidade",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/privacy-mobile.png",
    fullPage: true,
  });
  await page
    .locator('[aria-labelledby="privacy-banner-title"]')
    .screenshot({ path: "test-results/privacy-banner-mobile.png" });
});

test("refusal can be changed to acceptance without refreshing", async ({
  page,
  context,
}) => {
  await network(context);
  await page.goto("/privacy-policy");
  await page
    .getByRole("button", { name: "Recusar opcionais", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Preferências de privacidade", exact: true })
    .first()
    .click();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Salvar preferências", exact: true })
    .click();
  await expect(page.locator("#clarity-script")).toHaveCount(1);
});
test("search submission destroys the monitored document before displaying user text", async ({
  page,
  context,
}) => {
  await network(context);
  await page.goto("/privacy-policy");
  await accept(page);
  await page.evaluate(() => ((window as any).__oldDocument = true));
  const search = page.getByPlaceholder("Buscar produtos...").first();
  await search.fill("private-fixture");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=private-fixture$/);
  await expect(page.locator("#clarity-script")).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as any).__oldDocument),
  ).toBeUndefined();
});
test("expiry during an open session unloads the recorder", async ({
  page,
  context,
}) => {
  await network(context);
  await page.goto("/privacy-policy");
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    {
      key,
      value: {
        ...choice(true),
        expiresAt: new Date(Date.now() + 3500).toISOString(),
      },
    },
  );
  await page.reload();
  await expect(page.locator("#clarity-script")).toHaveCount(1);
  await expect(page.locator("#clarity-script")).toHaveCount(0, {
    timeout: 8000,
  });
  await expect(
    page.getByText("Sua privacidade é importante para nós"),
  ).toBeVisible();
});
test("authenticated checkout and payment choices remain available without Clarity", async ({
  page,
  context,
}) => {
  const requests = await network(context);
  await context.addCookies([
    {
      name: "ecommerce_session",
      value: "fixture",
      domain: "localhost",
      path: "/",
      httpOnly: true,
    },
  ]);
  await seed(page, choice(true));
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Finalizar pedido" }),
  ).toBeVisible();
  await page.goto("/account/orders/10/payment");
  await expect(
    page.getByRole("radio", { name: "PIX", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: "Cartão de crédito", exact: true }),
  ).toBeVisible();
  expect(requests).toEqual([]);
});
