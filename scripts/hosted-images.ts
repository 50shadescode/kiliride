// Explicit process manifest only: never load local .env or infer authorization.
import { getEnv } from "../src/server/env";
import { getDb } from "../src/server/db";
import { createS3Storage } from "../src/server/images/s3";
import { createPhotoService } from "../src/server/images/service";
import { verifyImageManifest } from "../src/server/images/recovery";
async function main() {
  const [operation, approval] = process.argv.slice(2);
  if (!["inspect", "reconcile"].includes(operation) || approval !== `--authorized-${operation}`) throw new Error();
  const env = getEnv(); if (!env.hosted || !env.storage) throw new Error();
  const storage = createS3Storage(env.storage), db = getDb();
  try {
    if (operation === "inspect") {
      const rows = await db.vehicleImageObject.findMany({ take: 10001 });
      if (rows.length > 10000) throw new Error();
      const result = await verifyImageManifest(rows, await storage.inventory(), storage);
      // Do not print private keys or provider diagnostics; retain a controlled
      // operator manifest separately when investigating counts.
      console.log({ verified: result.verified, missingOrCorrupt: result.missingOrCorrupt.length, unknown: result.unknown.length, pending: result.pending });
      if (result.missingOrCorrupt.length || result.unknown.length) process.exitCode = 1;
    } else {
      const service = createPhotoService(storage); let cursor: string | undefined;
      let examined = 0, removed = 0, failed = 0;
      do {
        const page = await service.reconcile(cursor);
        examined += page.examined; removed += page.removed; failed += page.failed; cursor = page.nextCursor ?? undefined;
        if (examined > 10000) throw new Error();
      } while (cursor);
      console.log({ examined, deleteRequestsCompleted: removed, failed, tombstonesRetained: true });
      if (failed) process.exitCode = 1;
    }
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Hosted image operation failed; inspect authorized configuration and retry. Details redacted."); process.exitCode = 1; });
