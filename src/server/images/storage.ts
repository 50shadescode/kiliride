import "server-only";
import { mkdir, lstat, open, unlink, realpath } from "node:fs/promises";
import path from "node:path";
import { assertLocalDatabase } from "../../../scripts/local-safety.mjs";

// A production adapter must provide private, durable, immutable put/get and
// idempotent remove. No public URL or arbitrary path is accepted by this API.
export interface ImageStorage {
  put(key: string, bytes: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}
export function imageStorageNamespace(databaseUrl: string | undefined) {
  const url = new URL(assertLocalDatabase(databaseUrl));
  if (url.pathname === "/kiliride_test") { assertLocalDatabase(databaseUrl, true); return "test"; }
  if (url.port !== "55432") throw new Error("Development image storage requires isolated development port 55432.");
  return "development";
}
export function imageStorage(): ImageStorage {
  const namespace = imageStorageNamespace(process.env.DATABASE_URL);
  const parent = path.resolve(process.cwd(), ".data");
  const root = path.join(parent, "vehicle-images", namespace);
  async function target(key: string) {
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/.test(key)) throw new Error("Invalid storage key");
    // Do not follow a configured directory/junction into public/ or another disk.
    for (const dir of [parent, path.dirname(root), root]) {
      await mkdir(dir, { recursive: false, mode: 0o700 }).catch(error => { if (error.code !== "EEXIST") throw error; });
      // Runtime data must never be included in build output-file tracing.
      const actual = await realpath(/* turbopackIgnore: true */ dir);
      const stat = await lstat(dir);
      if (stat.isSymbolicLink() || !stat.isDirectory() || actual.toLowerCase() !== dir.toLowerCase()) throw new Error("Unsafe image directory");
    }
    const result = path.resolve(root, key);
    if (path.dirname(result) !== root) throw new Error("Invalid storage path");
    return result;
  }
  async function regular(file: string) {
    const stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > 5 * 1024 * 1024) throw new Error("Unsafe image file");
  }
  return {
    async put(key, bytes) {
      const file = await target(key);
      const handle = await open(file, "wx", 0o600);
      try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
    },
    async get(key) {
      const file = await target(key); await regular(file);
      const handle = await open(file, "r");
      try { return await handle.readFile(); } finally { await handle.close(); }
    },
    async remove(key) {
      const file = await target(key);
      try { await regular(file); await unlink(file); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    },
  };
}
