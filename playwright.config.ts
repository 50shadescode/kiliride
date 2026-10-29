import "dotenv/config";
import { defineConfig } from "@playwright/test";
import { assertLocalDatabase } from "./scripts/local-safety.mjs";

assertLocalDatabase(process.env.TEST_DATABASE_URL, true);
export default defineConfig({
  testDir: "tests/integration",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  use: { baseURL: "http://localhost:3100", trace: "off", screenshot: "off", video: "off" },
  webServer: {
    command: "node scripts/run.mjs serve-test",
    url: "http://localhost:3100/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL!, BETTER_AUTH_URL: "http://localhost:3100" },
  },
});
