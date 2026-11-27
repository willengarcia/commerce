import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/installments-browser",
  workers: 1,
  timeout: 45000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3117",
    browserName: "chromium",
    headless: true,
  },
  webServer: [
    {
      command: "node tests/fixtures/installments-api.cjs",
      url: "http://127.0.0.1:3197/__test",
      reuseExistingServer: false,
    },
    {
      command: "node node_modules/next/dist/bin/next start -p 3117",
      url: "http://localhost:3117/login",
      reuseExistingServer: false,
      env: {
        BACKEND_API_URL: "http://127.0.0.1:3197",
        CLARITY_PRIVACY_REVIEWED: "false",
      },
    },
  ],
});
