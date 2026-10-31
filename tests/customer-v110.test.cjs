const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");

function harness({
  handler = async () => undefined,
  authenticated = true,
  overrides = {},
} = {}) {
  const cache = new Map();
  const calls = [];
  const cookieValues = new Map(
    authenticated ? [["ecommerce_session", "local-test-session"]] : [],
  );
  const cookieWrites = [];
  const jar = {
    get: (name) =>
      cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
    set: (name, value, options) => {
      cookieWrites.push({ name, value, options });
      if (options?.maxAge === 0) cookieValues.delete(name);
      else cookieValues.set(name, value);
    },
    delete: (name) => cookieValues.delete(name),
  };
  const mocks = {
    "server-only": {},
    "next/headers": { cookies: async () => jar },
    "next/cache": { revalidatePath() {} },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "lib/api/client": {
      apiFetch: async (url, options = {}) => {
        calls.push({ url, options });
        return handler(url, options);
      },
    },
    ...overrides,
  };
  function load(relative) {
    relative = relative.replaceAll("\\", "/").replace(/\.(tsx?|jsx?)$/, "");
    if (relative in mocks) return mocks[relative];
    if (cache.has(relative)) return cache.get(relative).exports;
    const filename = [".ts", ".tsx"]
      .map((ext) => path.join(root, relative + ext))
      .find(fs.existsSync);
    if (!filename) return require(relative);
    const module = { exports: {} };
    cache.set(relative, module);
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    const localRequire = (name) =>
      load(
        name.startsWith(".")
          ? path.relative(root, path.resolve(path.dirname(filename), name))
          : name,
      );
    new Function("require", "module", "exports", output)(
      localRequire,
      module,
      module.exports,
    );
    return module.exports;
  }
  return { load, calls, cookieValues, cookieWrites };
}
const actionsPath =
  "app/(account)/account/orders/[id]/payment/customer-actions";
const card = {
  token: "local-sdk-token",
  parcelas: 2,
  paymentMethodId: "master",
  issuerId: null,
};
const payment = (status = "PENDENTE", id = 20) => ({
  id,
  orderId: 10,
  statusPagamento: status,
  metodoPagamento: "CARTAO_CREDITO",
  valor: 100,
});
function form(values) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

test("reset rejects mismatches and password lengths without API calls", async () => {
  const h = harness();
  const { resetPasswordAction } = h.load("app/(account)/password-actions");
  for (const input of [
    { token: "", newPassword: "Abc12345", confirmation: "Abc12345" },
    { token: "test", newPassword: "short", confirmation: "short" },
    {
      token: "test",
      newPassword: "x".repeat(73),
      confirmation: "x".repeat(73),
    },
    { token: "test", newPassword: "Abc12345", confirmation: "different" },
  ])
    assert.ok((await resetPasswordAction({}, form(input))).error);
  assert.equal(h.calls.length, 0);
});
test("reset sends only token and password, and handles invalid/expired/used tokens", async () => {
  const h = harness();
  const action = h.load("app/(account)/password-actions").resetPasswordAction;
  assert.equal(
    (
      await action(
        {},
        form({
          token: "test",
          newPassword: "Abc12345",
          confirmation: "Abc12345",
        }),
      )
    ).success,
    true,
  );
  assert.deepEqual(JSON.parse(h.calls[0].options.body), {
    token: "test",
    newPassword: "Abc12345",
  });
  const ApiError = h.load("lib/api/errors").ApiError;
  for (const status of [400, 401, 410]) {
    const bad = harness({
      handler: async () => {
        throw new ApiError(status, "Invalid token", null);
      },
    });
    // Use the same error class identity in this module graph.
    const ErrorType = bad.load("lib/api/errors").ApiError;
    const another = harness({
      handler: async () => {
        throw new ErrorType(status, "Invalid token", null);
      },
      overrides: { "lib/api/errors": { ApiError: ErrorType } },
    });
    assert.match(
      (
        await another
          .load("app/(account)/password-actions")
          .resetPasswordAction(
            {},
            form({
              token: "test",
              newPassword: "Abc12345",
              confirmation: "Abc12345",
            }),
          )
      ).error,
      /inválido, utilizado ou expirado/,
    );
  }
});
test("forgot-password response is identical for existing and nonexistent emails", async () => {
  const h = harness();
  const action = h.load("app/(account)/password-actions").forgotPasswordAction;
  assert.deepEqual(
    await action({}, form({ email: "customer@example.test" })),
    await action({}, form({ email: "missing@example.test" })),
  );
  assert.ok((await action({}, form({ email: "invalid" }))).error);
});
test("card service allowlists tokenized fields and never sends raw card or SDK payer", async () => {
  const h = harness();
  await h.load("lib/api/payments").createCardPayment(10, {
    ...card,
    cardNumber: "not-a-card",
    cvv: "not-a-cvv",
    payer: { email: "local@example.test" },
  });
  assert.deepEqual(JSON.parse(h.calls[0].options.body), {
    metodoPagamento: "CARTAO_CREDITO",
    cartao: card,
  });
  assert.equal(h.calls[0].options.cache, "no-store");
  assert.match(h.calls[0].options.headers.Authorization, /^Bearer /);
});
test("card rejects invalid installments, issuer and token before any request", async () => {
  const h = harness();
  const action = h.load(actionsPath).submitCustomerPaymentAction;
  for (const value of [
    { ...card, parcelas: 0 },
    { ...card, parcelas: 1.5 },
    { ...card, token: "" },
    { ...card, issuerId: -1 },
    { ...card, paymentMethodId: "" },
  ])
    assert.ok((await action(10, value)).error);
  assert.equal(h.calls.length, 0);
});
test("pending, approved and refunded payment are reused without POST", async () => {
  for (const status of ["PENDENTE", "APROVADO", "REEMBOLSADO"]) {
    const h = harness({ handler: async () => payment(status) });
    assert.equal(
      (await h.load(actionsPath).submitCustomerPaymentAction(10, card)).payment
        .statusPagamento,
      status,
    );
    assert.equal(h.calls.filter((c) => c.options.method === "POST").length, 0);
  }
});
test("an unexpected backend payment status blocks a second charge", async () => {
  const h = harness({ handler: async () => payment("DESCONHECIDO") });
  const result = await h
    .load(actionsPath)
    .submitCustomerPaymentAction(10, card);
  assert.equal(result.payment.statusPagamento, "DESCONHECIDO");
  assert.equal(
    h.calls.filter((call) => call.options.method === "POST").length,
    0,
  );
});
test("successful card approval/rejection clears guard and returns backend result", async () => {
  for (const status of ["APROVADO", "RECUSADO", "CANCELADO"]) {
    let h;
    h = harness({
      handler: async (url, options) => {
        if (options.method === "POST") return payment(status);
        throw new (h.load("lib/api/errors").ApiError)(404, "Not found", null);
      },
    });
    assert.equal(
      (await h.load(actionsPath).submitCustomerPaymentAction(10, card)).payment
        .statusPagamento,
      status,
    );
    assert.equal(h.cookieValues.has("payment_attempt_10"), false);
    assert.equal(h.calls.filter((c) => c.options.method === "POST").length, 1);
    assert.equal(
      h.cookieWrites.at(-1).options.path,
      "/account/orders/10/payment",
    );
  }
});
test("PIX retains its request contract", async () => {
  let h;
  h = harness({
    handler: async (url, options) => {
      if (options.method === "POST")
        return { ...payment(), metodoPagamento: "PIX" };
      throw new (h.load("lib/api/errors").ApiError)(404, "Not found", null);
    },
  });
  await h.load(actionsPath).submitCustomerPaymentAction(10, null);
  assert.deepEqual(
    JSON.parse(h.calls.find((c) => c.options.method === "POST").options.body),
    { metodoPagamento: "PIX" },
  );
});
test("timeout reconciles pending payment and never automatically repeats POST", async () => {
  let created = false,
    h;
  h = harness({
    handler: async (url, options) => {
      if (options.method === "POST") {
        created = true;
        throw Error("timeout");
      }
      if (created) return payment();
      throw new (h.load("lib/api/errors").ApiError)(404, "Not found", null);
    },
  });
  const actions = h.load(actionsPath);
  assert.equal(
    (await actions.submitCustomerPaymentAction(10, card)).payment
      .statusPagamento,
    "PENDENTE",
  );
  await actions.submitCustomerPaymentAction(10, card);
  assert.equal(h.calls.filter((c) => c.options.method === "POST").length, 1);
});
test("unknown timeout stays blocked across reload/status checks, even with old declined payment", async () => {
  const h = harness({
    handler: async (url, options) => {
      if (options.method === "POST") throw Error("timeout");
      return payment("RECUSADO", 19);
    },
  });
  const action = h.load(actionsPath);
  assert.equal(
    (await action.submitCustomerPaymentAction(10, card)).verifying,
    true,
  );
  assert.equal((await action.inspectOrderPaymentAction(10)).verifying, true);
  await action.submitCustomerPaymentAction(10, card);
  assert.equal(h.calls.filter((c) => c.options.method === "POST").length, 1);
});
test("status communication failure and missing session never create a charge", async () => {
  const h = harness({
    handler: async () => {
      throw Error("offline");
    },
  });
  assert.equal(
    (await h.load(actionsPath).submitCustomerPaymentAction(10, card)).verifying,
    true,
  );
  assert.equal(
    h.calls.some((c) => c.options.method === "POST"),
    false,
  );
  const guest = harness({ authenticated: false });
  assert.ok(
    (await guest.load(actionsPath).submitCustomerPaymentAction(10, card)).error,
  );
  assert.equal(guest.calls.length, 0);
});
test("review validation and mutations match API, with no status supplied by frontend", async () => {
  const h = harness({
    handler: async () => ({ id: 4, productId: 1, status: "PENDENTE" }),
  });
  const actions = h.load("app/(account)/review-actions");
  assert.ok((await actions.saveReviewAction(1, null, 6, "")).error);
  assert.ok(
    (await actions.saveReviewAction(1, null, 5, "x".repeat(1001))).error,
  );
  assert.equal(h.calls.length, 0);
  assert.equal(
    (await actions.saveReviewAction(1, null, 5, "Boa compra")).review.status,
    "PENDENTE",
  );
  assert.deepEqual(JSON.parse(h.calls[0].options.body), {
    nota: 5,
    comentario: "Boa compra",
  });
  await actions.saveReviewAction(1, 4, 4, "Atualizada");
  assert.equal(h.calls[1].options.method, "PATCH");
  await actions.deleteReviewAction(4);
  assert.equal(h.calls[2].options.method, "DELETE");
});
test("review backend eligibility and duplicate errors are preserved", async () => {
  for (const message of [
    "Você só pode avaliar produtos de pedidos entregues",
    "Você já avaliou este produto",
  ]) {
    let h;
    h = harness({
      handler: async () => {
        throw new (h.load("lib/api/errors").ApiError)(409, message, null);
      },
    });
    assert.equal(
      (
        await h
          .load("app/(account)/review-actions")
          .saveReviewAction(1, null, 5, "")
      ).error,
      message,
    );
  }
});
test("public and private review pagination use collection endpoints", async () => {
  const h = harness();
  const service = h.load("lib/api/reviews");
  await service.getProductReviews(1, 2);
  await service.getMyReviews(3);
  assert.match(
    h.calls[0].url,
    /products\/1\/reviews\?page=2&size=10&sort=dataCriacao,desc/,
  );
  assert.equal(h.calls[0].options.headers, undefined);
  assert.match(h.calls[1].url, /reviews\/me\?page=3/);
});
test("public review rendering hides pending and rejected content", () => {
  const h = harness();
  const { ReviewsPanel } = h.load("components/reviews/reviews-panel");
  const content = ["APROVADA", "PENDENTE", "REJEITADA"].map(
    (status, index) => ({
      id: index + 1,
      productId: 1,
      nota: 5,
      status,
      nomeCliente: "Cliente",
      comentario: `content-${status}`,
      dataCriacao: "2026-10-30T12:00:00",
    }),
  );
  const html = renderToStaticMarkup(
    React.createElement(ReviewsPanel, {
      productId: 1,
      initialPage: { content, totalPages: 1 },
    }),
  );
  assert.match(html, /content-APROVADA/);
  assert.doesNotMatch(html, /content-PENDENTE|content-REJEITADA/);
});
test("official React Brick initializes safely, restricts credit and forwards only tokenized DTO", async () => {
  const effects = [];
  let settings, submitted, initialization;
  let releaseSubmission;
  let submissionCount = 0;
  const submissionGate = new Promise((resolve) => {
    releaseSubmission = resolve;
  });
  const mockReact = {
    ...React,
    useRef: (value) => ({ current: value }),
    useState: (value) => [typeof value === "boolean" ? true : value, () => {}],
    useEffect: (fn) => effects.push(fn),
    useCallback: (fn) => fn,
  };
  const h = harness({
    overrides: {
      react: mockReact,
      "@mercadopago/sdk-react": {
        initMercadoPago: (key, options) => {
          initialization = { key, options };
        },
        CardPayment: (props) => {
          settings = props;
          return null;
        },
      },
    },
  });
  const { MercadoPagoCardBrick } = h.load(
    "components/payment/mercado-pago-card-brick",
  );
  const element = MercadoPagoCardBrick({
    publicKey: "local-test-public-key",
    amount: 123.45,
    orderId: 10,
    disabled: false,
    onSubmit: async (value) => {
      submitted = value;
      submissionCount += 1;
      await submissionGate;
    },
  });
  effects.forEach((fn) => fn());
  renderToStaticMarkup(element);
  assert.deepEqual(initialization, {
    key: "local-test-public-key",
    options: { locale: "pt-BR" },
  });
  assert.equal(settings.initialization.amount, 123.45);
  assert.deepEqual(settings.customization.paymentMethods, {
    types: { excluded: ["debit_card", "prepaid_card"] },
  });
  const firstSubmission = settings.onSubmit(
    {
      token: "local-token",
      installments: 3,
      payment_method_id: "visa",
      issuer_id: "42",
    },
    { paymentTypeId: "credit_card" },
  );
  await settings.onSubmit(
    {
      token: "second-token",
      installments: 1,
      payment_method_id: "visa",
      issuer_id: "42",
    },
    { paymentTypeId: "credit_card" },
  );
  assert.equal(submissionCount, 1);
  releaseSubmission();
  await firstSubmission;
  assert.deepEqual(submitted, {
    token: "local-token",
    parcelas: 3,
    paymentMethodId: "visa",
    issuerId: 42,
  });
  submitted = undefined;
  await settings.onSubmit(
    { token: "", installments: 0, payment_method_id: "", issuer_id: "" },
    { paymentTypeId: "credit_card" },
  );
  assert.equal(submitted, undefined);
});

test("PIX details render backend QR code, copy code, amount, expiration and waiting state", () => {
  const h = harness({
    overrides: {
      "next/image": (props) =>
        React.createElement("img", { src: props.src, alt: props.alt }),
    },
  });
  const { PaymentDetails } = h.load("components/payment/payment-experience");
  const pix = {
    ...payment("PENDENTE"),
    metodoPagamento: "PIX",
    qrCodePix: "base64-pix",
    pixCopiaCola: "pix-copy-code",
    dataExpiracao: "2099-10-30T12:00:00",
  };
  const html = renderToStaticMarkup(
    React.createElement(PaymentDetails, { payment: pix, onPaymentChange() {} }),
  );
  assert.match(html, /data:image\/png;base64,base64-pix/);
  assert.match(html, /pix-copy-code/);
  assert.match(html, /Copiar código PIX/);
  assert.match(html, /Aguardando confirmação do pagamento/);
  assert.match(html, /Expiração/);
});
