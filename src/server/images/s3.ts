import "server-only";
import { Agent } from "node:https";
import { createHash } from "node:crypto";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, GetPublicAccessBlockCommand, GetBucketPolicyStatusCommand, GetBucketAclCommand, GetBucketVersioningCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import type { StorageConfig } from "./config";
import type { ImageStorage } from "./storage";
const limit = 5 * 1024 * 1024;
export function assertImageKey(key: string) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/.test(key)) throw new Error("Invalid storage key.");
}
export function s3Client(config: StorageConfig) {
  return new S3Client({ endpoint: config.endpoint, region: config.region, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    forcePathStyle: true, followRegionRedirects: false, maxAttempts: 1,
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED",
    requestHandler: new NodeHttpHandler({ connectionTimeout: 2000, requestTimeout: 5000, throwOnRequestTimeout: true, httpsAgent: new Agent({ keepAlive: true, maxSockets: 8, rejectUnauthorized: true, minVersion: "TLSv1.2" }) }) });
}
// Injectable SDK client is for isolated protocol tests, never selected by env flags.
export function createS3Storage(config: StorageConfig, client = s3Client(config)): ImageStorage & { inventory(): Promise<string[]> } {
  const base = { Bucket: config.bucket };
  const keyOf = (key: string) => { assertImageKey(key); return config.prefix + key; };
  async function bounded<T>(work: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try { return await work(controller.signal); } catch { throw new Error("Private photograph storage unavailable."); }
    finally { clearTimeout(timeout); }
  }
  async function privateBucket(signal: AbortSignal) {
    const options = { abortSignal: signal };
    const [block, policy, acl, version] = await Promise.all([
      client.send(new GetPublicAccessBlockCommand(base), options), client.send(new GetBucketPolicyStatusCommand(base), options),
      client.send(new GetBucketAclCommand(base), options), client.send(new GetBucketVersioningCommand(base), options),
    ]);
    const b = block.PublicAccessBlockConfiguration;
    if (!b?.BlockPublicAcls || !b.IgnorePublicAcls || !b.BlockPublicPolicy || !b.RestrictPublicBuckets || policy.PolicyStatus?.IsPublic !== false || version.Status !== "Enabled" ||
      !acl.Owner?.ID || !acl.Grants?.length || acl.Grants.some(g => g.Grantee?.Type !== "CanonicalUser" || g.Grantee.ID !== acl.Owner!.ID)) throw new Error("Unsafe bucket.");
  }
  return {
    retainCleanupJournal: true,
    async put(key, bytes) {
      const Key = keyOf(key);
      if (!bytes.length || bytes.length > limit) throw new Error("Invalid image size.");
      await bounded(async signal => {
        await privateBucket(signal);
        await client.send(new PutObjectCommand({ ...base, Key, Body: bytes, ContentLength: bytes.length, ContentType: "image/webp", CacheControl: "private, no-store",
          IfNoneMatch: "*", ServerSideEncryption: "AES256", ChecksumSHA256: createHash("sha256").update(bytes).digest("base64") }), { abortSignal: signal });
      });
    },
    async get(key) {
      const Key = keyOf(key);
      return bounded(async signal => {
        await privateBucket(signal);
        const result = await client.send(new GetObjectCommand({ ...base, Key }), { abortSignal: signal });
        const body = result.Body as (AsyncIterable<Uint8Array> & { destroy(): void }) | undefined;
        if (!body) throw new Error();
        const abort = () => body.destroy(); signal.addEventListener("abort", abort, { once: true });
        try {
          if (!result.ContentLength || result.ContentLength > limit || result.ContentType !== "image/webp") throw new Error();
          const parts: Buffer[] = []; let size = 0;
          for await (const chunk of body) { size += chunk.length; if (signal.aborted || size > limit) throw new Error(); parts.push(Buffer.from(chunk)); }
          if (size !== result.ContentLength || signal.aborted) throw new Error();
          return Buffer.concat(parts);
        } finally { signal.removeEventListener("abort", abort); body.destroy(); }
      });
    },
    async remove(key) {
      const Key = keyOf(key);
      await bounded(async signal => { await privateBucket(signal); await client.send(new DeleteObjectCommand({ ...base, Key }), { abortSignal: signal }); });
    },
    async inventory() {
      // Operator-only inventory is bounded; never silently return an incomplete list.
      return bounded(async signal => {
        await privateBucket(signal); const keys: string[] = []; let token: string | undefined;
        do {
          const page = await client.send(new ListObjectsV2Command({ ...base, Prefix: config.prefix, MaxKeys: 1000, ContinuationToken: token }), { abortSignal: signal });
          for (const object of page.Contents ?? []) {
            if (!object.Key?.startsWith(config.prefix)) throw new Error();
            keys.push(object.Key.slice(config.prefix.length));
          }
          token = page.IsTruncated ? page.NextContinuationToken : undefined;
          if (page.IsTruncated && !token || keys.length > 10000) throw new Error();
        } while (token);
        return keys;
      });
    },
  };
}
