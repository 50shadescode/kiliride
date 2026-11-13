import { isIP } from "node:net";
export type StorageConfig = { endpoint: string; region: string; bucket: string; prefix: string; accessKeyId: string; secretAccessKey: string };
export function storageConfig(source: Record<string, string | undefined>, mode: string): StorageConfig | undefined {
  const hosted = mode === "staging" || mode === "production";
  const fields = ["STORAGE_ENDPOINT", "STORAGE_REGION", "STORAGE_BUCKET", "STORAGE_PREFIX", "STORAGE_ACCESS_KEY_ID", "STORAGE_SECRET_ACCESS_KEY"];
  if (!hosted) {
    if (source.STORAGE_DRIVER && source.STORAGE_DRIVER !== "filesystem" || fields.some(key => source[key])) throw new Error("Invalid private storage configuration.");
    return undefined;
  }
  try {
    if (source.STORAGE_DRIVER !== "s3" || source.STORAGE_ENVIRONMENT !== mode || fields.some(key => !source[key]) || source.NODE_TLS_REJECT_UNAUTHORIZED === "0") throw new Error();
    const endpoint = new URL(source.STORAGE_ENDPOINT!);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.port || endpoint.search || endpoint.hash || endpoint.pathname !== "/" ||
        isIP(endpoint.hostname) || !endpoint.hostname.includes(".") || /(^|\.)(localhost|local|test|invalid)$/.test(endpoint.hostname) || endpoint.hostname !== source.STORAGE_EXPECTED_HOST) throw new Error();
    const bucket = source.STORAGE_BUCKET!;
    if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket) || !bucket.endsWith(`-${mode}`) || bucket !== source.STORAGE_EXPECTED_BUCKET ||
        source.STORAGE_PREFIX !== `${mode}/vehicle-images/` || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(source.STORAGE_REGION!)) throw new Error();
    for (const key of ["STORAGE_ACCESS_KEY_ID", "STORAGE_SECRET_ACCESS_KEY"]) if (/^(REPLACE|CHANGE|EXAMPLE)/i.test(source[key]!) || /\s/.test(source[key]!)) throw new Error();
    if (source.STORAGE_ACCESS_KEY_ID!.length < 8 || source.STORAGE_SECRET_ACCESS_KEY!.length < 20) throw new Error();
    return { endpoint: endpoint.origin, bucket, prefix: source.STORAGE_PREFIX!, region: source.STORAGE_REGION!, accessKeyId: source.STORAGE_ACCESS_KEY_ID!, secretAccessKey: source.STORAGE_SECRET_ACCESS_KEY! };
  } catch { throw new Error("Invalid private storage configuration."); }
}
