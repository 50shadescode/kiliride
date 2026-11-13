import "server-only";
import { createHash } from "node:crypto";
import type { ImageStorage } from "./storage";
export type ImageManifest = { key: string; sha256: string; byteSize: number; state: string }[];
// Read-only: inventory discrepancies must never become implicit deletion authority.
export async function verifyImageManifest(manifest: ImageManifest, inventory: string[], storage: ImageStorage) {
  const known = new Set(manifest.map(row => row.key));
  const unknown = inventory.filter(key => !known.has(key));
  const missingOrCorrupt: string[] = []; let verified = 0;
  for (const row of manifest.filter(row => row.state === "ACTIVE")) {
    try {
      const bytes = await storage.get(row.key);
      if (bytes.length !== row.byteSize || createHash("sha256").update(bytes).digest("hex") !== row.sha256) throw new Error();
      verified++;
    } catch { missingOrCorrupt.push(row.key); }
  }
  return { verified, missingOrCorrupt, unknown, pending: manifest.filter(row => row.state !== "ACTIVE").length };
}
