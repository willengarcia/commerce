const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
function load() {
  const module = { exports: {} };
  const source = fs.readFileSync(
    path.join(__dirname, "../lib/privacy/consent.ts"),
    "utf8",
  );
  new Function(
    "module",
    "exports",
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
  )(module, module.exports);
  return module.exports;
}
const c = load();
test("both choices retain only version, purpose and timestamps for 180 days", () => {
  for (const analytics of [true, false]) {
    const value = c.makeConsent(analytics, 1000000000000);
    assert.equal(
      Date.parse(value.expiresAt) - Date.parse(value.decidedAt),
      180 * 86400000,
    );
    assert.deepEqual(
      c.parseConsent(
        JSON.stringify({ ...value, email: "must-not-persist@example.test" }),
        1000000001000,
      ),
      value,
    );
    assert.equal(value.advertising, false);
  }
});
test("corrupt, expired, future, version-mismatched and incomplete records fail closed", () => {
  const now = Date.now();
  const value = c.makeConsent(true, now);
  for (const raw of [
    null,
    "invalid",
    "{}",
    JSON.stringify({ ...value, version: "old" }),
    JSON.stringify({ ...value, advertising: true }),
    JSON.stringify({ ...value, decidedAt: null }),
    JSON.stringify(c.makeConsent(true, now - 181 * 86400000)),
    JSON.stringify(c.makeConsent(true, now + 10000)),
  ])
    assert.equal(c.parseConsent(raw, now), null);
});
test("only explicit public paths without query or fragments are eligible", () => {
  for (const route of [
    "/",
    "/search",
    "/search/category/2",
    "/product/123",
    "/privacy-policy",
  ])
    assert.equal(
      c.isPublicAnalyticsUrl(new URL(route, "https://example.test")),
      true,
    );
  for (const route of [
    "/checkout",
    "/cart",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password?token=secret",
    "/account",
    "/account/orders/1/payment",
    "/admin",
    "/unknown",
    "/product/email@example.test",
    "/search?q=personal",
    "/?email=personal",
    "/product/1#personal",
  ])
    assert.equal(
      c.isPublicAnalyticsUrl(new URL(route, "https://example.test")),
      false,
    );
});
test("unavailable browser storage never grants analytics", () => {
  const before = global.window;
  global.window = {
    get localStorage() {
      throw new Error("blocked");
    },
  };
  try {
    assert.equal(c.readConsent(), null);
    assert.equal(c.saveConsent(c.makeConsent(true)), false);
  } finally {
    if (before === undefined) delete global.window;
    else global.window = before;
  }
});

function runtime({ analytics = true, importFails = false } = {}) {
  const calls = [];
  let imports = 0;
  const location = {
    href: "https://example.test/",
    hostname: "example.test",
    pathname: "/",
    origin: "https://example.test",
    replace: (url) => calls.push(["reload", url]),
    assign: (url) => calls.push(["navigate", url]),
  };
  const sdk = {
    init: (id) => calls.push(["init", id]),
    consentV2: (value) => calls.push(["consentv2", value]),
  };
  const exports = {};
  const context = {
    exports,
    URL,
    Promise,
    location,
    window: { addEventListener() {}, location },
    document: {
      addEventListener() {},
      querySelector() {
        return null;
      },
      cookie: "",
    },
    require(name) {
      if (name === "lib/privacy/consent")
        return {
          isPublicAnalyticsUrl: c.isPublicAnalyticsUrl,
          readConsent: () => ({ analytics }),
        };
      if (name === "@microsoft/clarity") {
        imports++;
        if (importFails) throw new Error("offline");
        return { default: sdk };
      }
      throw new Error(name);
    },
  };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        path.join(__dirname, "../lib/analytics/clarity.ts"),
        "utf8",
      ),
      {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.CommonJS,
        },
      },
    ).outputText,
    context,
  );
  return { api: exports, calls, imports: () => imports };
}
test("no import or initialization without ID, consent or permission", async () => {
  const r = runtime();
  await r.api.startClarity("", true);
  await r.api.startClarity("fixture", false);
  assert.equal(r.imports(), 0);
  const denied = runtime({ analytics: false });
  await denied.api.startClarity("fixture", true);
  assert.equal(denied.imports(), 0);
});
test("concurrent initialization is unique; revocation denies advertising and destroys the document", async () => {
  const r = runtime();
  await Promise.all([
    r.api.startClarity("fixture", true),
    r.api.startClarity("fixture", true),
  ]);
  assert.equal(r.imports(), 1);
  assert.equal(r.calls.filter((x) => x[0] === "init").length, 1);
  assert.equal(r.calls[1][1].ad_Storage, "denied");
  r.api.revokeClarity(true);
  assert.equal(r.calls[2][1].analytics_Storage, "denied");
  assert.equal(r.calls[3][0], "reload");
  await r.api.startClarity("fixture", true);
  assert.equal(r.imports(), 1);
});
test("module failure is contained and does not retry repeatedly", async () => {
  const r = runtime({ importFails: true });
  await r.api.startClarity("fixture", true);
  await r.api.startClarity("fixture", true);
  assert.equal(r.imports(), 1);
  assert.equal(r.calls.length, 0);
});
