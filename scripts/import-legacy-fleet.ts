import "dotenv/config";
import { assertLocalDatabase } from "./local-safety.mjs";

async function main() {
  const [target, mode, operator, ...extra] = process.argv.slice(2);
  if (!["dev", "test"].includes(target) || !["--dry-run", "--apply"].includes(mode) || !operator || extra.length) {
    throw new Error("Usage: dev|test --dry-run|--apply \"operator name\"");
  }
  const url = new URL(assertLocalDatabase(target === "test" ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL, target === "test"));
  if (url.port !== (target === "test" ? "55433" : "55432") || url.pathname !== `/kiliride_${target}`) throw new Error("Unexpected local import target.");
  process.env.DATABASE_URL = url.href;
  const { importLegacyFleet } = await import("../src/server/fleet/import");
  const { getDb } = await import("../src/server/db");
  try { console.log(JSON.stringify(await importLegacyFleet(operator, mode === "--apply"), null, 2)); }
  finally { await getDb().$disconnect(); }
}

main().catch(() => { console.error("Import refused. Check arguments, local configuration and source conflicts; no partial import is committed."); process.exitCode = 1; });
