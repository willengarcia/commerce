import { test, expect } from "@playwright/test";

test("build without project ID never requests Clarity even with saved acceptance", async ({
  page,
  context,
}) => {
  const calls: string[] = [];
  await context.route(
    /https:\/\/([^/]*\.)?(clarity\.ms|bing\.com)\//,
    (route) => {
      calls.push(route.request().url());
      return route.abort();
    },
  );
  await page.addInitScript(() => {
    localStorage.setItem(
      "platun.privacy-consent",
      JSON.stringify({
        version: "1.0.0",
        necessary: true,
        analytics: true,
        advertising: false,
        decidedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    );
  });
  await page.goto("/privacy-policy");
  await page
    .getByRole("button", { name: "Preferências de privacidade", exact: true })
    .first()
    .click();
  await expect(page.getByRole("checkbox")).toBeDisabled();
  await page.waitForTimeout(1200);
  expect(calls).toEqual([]);
  await expect(page.locator("#clarity-script")).toHaveCount(0);
});
