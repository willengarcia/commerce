import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/privacy-browser",
  testMatch: process.env.PRIVACY_TEST_NO_ID
    ? "no-id.spec.ts"
    : "consent.spec.ts",
  timeout: 45000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3108",
    browserName: "chromium",
    headless: true,
  },
  webServer: [
    {
      command: "node tests/fixtures/privacy-api.cjs",
      url: "http://127.0.0.1:3198",
      reuseExistingServer: false,
    },
    {
      command: "node node_modules/next/dist/bin/next start -p 3108",
      url: "http://localhost:3108/privacy-policy",
      reuseExistingServer: false,
      timeout: 60000,
      env: {
        BACKEND_API_URL: "http://127.0.0.1:3198",
        CLARITY_PRIVACY_REVIEWED: "true",
        PRIVACY_CONTROLLER_NAME: "Controlador de teste",
        PRIVACY_CONTROLLER_CNPJ: "somente fixture",
        PRIVACY_CONTACT_EMAIL: "privacy@example.test",
      },
    },
  ],
});
