import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page, context, request }) => {
  await request.post("http://127.0.0.1:3197/__test", { data: {} });
  await context.addCookies([
    {
      name: "ecommerce_session",
      value: "fixture",
      domain: "localhost",
      path: "/",
      httpOnly: true,
    },
  ]);
  await page.route("https://sdk.mercadopago.com/js/v2", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
    window.MP_DEVICE_SESSION_ID='device-fixture';
    window.MercadoPago=function(){return {bricks(){return {async create(name,id,settings){
      const root=document.getElementById(id); if(!root)return {unmount(){}};
      window.__brickSettings=settings; window.__brickSubmit=settings.callbacks.onSubmit;
      const select=document.createElement('select'); select.setAttribute('aria-label','Parcelas do provedor');
      const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Escolha parcelas';select.appendChild(placeholder);
      for(const n of (window.__offeredInstallments || [1,2,3]).filter(n=>n>=settings.customization.paymentMethods.minInstallments&&n<=settings.customization.paymentMethods.maxInstallments)){
        const option=document.createElement('option');option.value=String(n);option.textContent=n+'x — condição de teste do provedor';select.appendChild(option);
      }
      const button=document.createElement('button');button.textContent='Confirmar cartão simulado';button.disabled=true;button.type='button';
      select.onchange=()=>{button.disabled=!select.value};
      button.onclick=()=>settings.callbacks.onSubmit({token:'fixture-token',installments:Number(select.value),payment_method_id:'visa',issuer_id:'1',transaction_amount:settings.initialization.amount},{paymentTypeId:'credit_card'});
      root.append(select,button);settings.callbacks.onReady();
      return {unmount(){root.replaceChildren()}};
    }}}}};
  `,
    }),
  );
  await page.route(
    /https:\/\/.*(mercadopago|mlstatic|clarity)\..*/,
    async (route) => {
      if (route.request().url() === "https://sdk.mercadopago.com/js/v2")
        return route.fallback();
      return route.abort();
    },
  );
});
async function openCard(page: import("@playwright/test").Page) {
  await page.goto("/account/orders/10/payment");
  await page
    .getByRole("radio", { name: "Cartão de crédito", exact: true })
    .check();
}

test("thresholds and provider availability constrain the existing Brick", async ({
  page,
  request,
}) => {
  for (const [amount, max] of [
    [99.99, 1],
    [100, 1],
    [100.01, 5],
    [150, 5],
  ]) {
    await request.post("http://127.0.0.1:3197/__test", { data: { amount } });
    await openCard(page);
    const select = page.getByLabel("Parcelas do provedor");
    await expect(select).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          (window as any).__brickSettings.customization.paymentMethods
            .maxInstallments,
      ),
    ).toBe(max);
    await expect(select.locator("option")).toHaveCount(max === 1 ? 2 : 4); // placeholder + actual provider choices only
    await expect(
      page.getByRole("button", { name: "Confirmar cartão simulado" }),
    ).toBeDisabled();
  }
});
test("disabled installments and backend limit 3 are honored", async ({
  page,
  request,
}) => {
  for (const config of [
    {
      enabled: false,
      minimumOrderValue: 100,
      maxInstallments: 5,
      buyerPaysInterest: true,
    },
    {
      enabled: true,
      minimumOrderValue: 100,
      maxInstallments: 3,
      buyerPaysInterest: false,
    },
  ]) {
    await request.post("http://127.0.0.1:3197/__test", { data: { config } });
    await openCard(page);
    await expect(page.getByLabel("Parcelas do provedor")).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          (window as any).__brickSettings.customization.paymentMethods
            .maxInstallments,
      ),
    ).toBe(config.enabled ? 3 : 1);
  }
});
test("provider may offer only 2x; frontend does not manufacture 1x or 5x", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__offeredInstallments = [2];
  });
  await openCard(page);
  await expect(
    page.getByLabel("Parcelas do provedor").locator("option"),
  ).toHaveCount(2);
  await expect(
    page.getByLabel("Parcelas do provedor").locator('option[value="2"]'),
  ).toHaveCount(1);
});
test("config unavailable blocks the Brick and retry retrieves current conditions", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:3197/__test", {
    data: { unavailable: true },
  });
  await openCard(page);
  await expect(
    page.getByRole("button", { name: "Tentar novamente", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Parcelas do provedor")).toHaveCount(0);
  await request.post("http://127.0.0.1:3197/__test", { data: {} });
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(page.getByLabel("Parcelas do provedor")).toBeVisible();
});
test("422 shows backend reason, refreshes and clears selection without another POST", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:3197/__test", {
    data: { rejectOnce: true },
  });
  await openCard(page);
  await page.getByLabel("Parcelas do provedor").selectOption("3");
  await page.getByRole("button", { name: "Confirmar cartão simulado" }).click();
  await expect(
    page.getByText("O número máximo de parcelas permitido é 3"),
  ).toBeVisible();
  await expect(page.getByLabel("Parcelas do provedor")).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Confirmar cartão simulado" }),
  ).toBeDisabled();
  const state = await (
    await request.get("http://127.0.0.1:3197/__test")
  ).json();
  expect(state.posts).toHaveLength(1);
  expect(state.posts[0].body).toEqual({
    metodoPagamento: "CARTAO_CREDITO",
    cartao: {
      token: "fixture-token",
      parcelas: 3,
      paymentMethodId: "visa",
      issuerId: 1,
    },
  });
  expect(state.posts[0].device).toBe("device-fixture");
});
test("new amount clears selection and late callback from discarded Brick cannot submit", async ({
  page,
  request,
}) => {
  await openCard(page);
  await page.getByLabel("Parcelas do provedor").selectOption("2");
  await page.evaluate(
    () => ((window as any).__previousSubmit = (window as any).__brickSubmit),
  );
  await request.post("http://127.0.0.1:3197/__test", { data: { amount: 100 } });
  await page
    .getByRole("button", { name: "Atualizar condições de parcelamento" })
    .click();
  await expect(page.getByLabel("Parcelas do provedor")).toHaveValue("");
  expect(
    await page.evaluate(
      () => (window as any).__brickSettings.initialization.amount,
    ),
  ).toBe(100);
  await page.evaluate(() =>
    (window as any).__previousSubmit(
      {
        token: "old-token",
        installments: 2,
        payment_method_id: "visa",
        issuer_id: "1",
      },
      { paymentTypeId: "credit_card" },
    ),
  );
  expect(
    (await (await request.get("http://127.0.0.1:3197/__test")).json()).posts,
  ).toHaveLength(0);
});
test("approved payment displays installments, never invents installment value", async ({
  page,
}) => {
  await openCard(page);
  await page.getByLabel("Parcelas do provedor").selectOption("3");
  await page.getByRole("button", { name: "Confirmar cartão simulado" }).click();
  await expect(page.getByText("Cartão de crédito — 3x")).toBeVisible();
  await expect(
    page.getByText("Pagamento aprovado", { exact: true }),
  ).toBeVisible();
});
