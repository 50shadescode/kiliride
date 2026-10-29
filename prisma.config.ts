import "dotenv/config";
import { defineConfig } from "prisma/config";
import { assertLocalDatabase } from "./scripts/local-safety.mjs";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: assertLocalDatabase(process.env.DATABASE_URL) },
});
