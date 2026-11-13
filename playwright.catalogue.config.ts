import "dotenv/config";
import { defineConfig } from "@playwright/test";
import { assertLocalDatabase } from "./scripts/local-safety.mjs";
assertLocalDatabase(process.env.TEST_DATABASE_URL, true);
export default defineConfig({
  testDir: "tests/catalogue", workers: 1, fullyParallel: false, timeout: 120000, expect: { timeout: 15000 }, reporter: "list",
  use: { baseURL: "http://localhost:3101", trace: "off", screenshot: "off", video: "off" },
  webServer: { command: "node scripts/run.mjs serve-catalogue-test", url: "http://localhost:3101/login", reuseExistingServer: false, timeout: 120000,
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL!, BETTER_AUTH_URL: "http://localhost:3101", KILIRIDE_DB_CATALOGUE: "true" } },
});
