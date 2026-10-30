import { defineConfig } from "prisma/config";
import { fileURLToPath } from "node:url";

// Separate from application configuration: only newly named disposable databases
// on the isolated test PostgreSQL instance may be used by the rehearsal CLI.
const url = new URL(process.env.REHEARSAL_DATABASE_URL ?? "invalid:");
if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    url.port !== '55433' || !/^\/kiliride_rehearsal_[a-f0-9]{32}$/.test(url.pathname) ||
    url.search || url.hash) {
  throw new Error("Rehearsal requires a disposable database on the local test instance.");
}

export default defineConfig({
  schema: fileURLToPath(new URL("../prisma/schema.prisma", import.meta.url)),
  migrations: { path: fileURLToPath(new URL("../prisma/migrations", import.meta.url)) },
  datasource: { url: url.href },
});
