// Explicit operator-only config. Does not load .env or reuse runtime credentials.
import { defineConfig } from "prisma/config";
import { hostedMigrationUrl } from "../src/server/runtime-config";
export default defineConfig({
  schema: "../prisma/schema.prisma", migrations: { path: "../prisma/migrations" },
  datasource: { url: hostedMigrationUrl(process.env) },
});
