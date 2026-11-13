// Isolated S3 protocol double: real SDK serialization/signing, no network/cloud.
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { createHash } from "node:crypto";
import { S3Client } from "@aws-sdk/client-s3";
import type { ImageStorage } from "../../src/server/images/storage";
export const syntheticStorageEnv = {
  STORAGE_DRIVER: "s3", STORAGE_ENVIRONMENT: "staging", STORAGE_ENDPOINT: "https://objects.provider.example",
  STORAGE_EXPECTED_HOST: "objects.provider.example", STORAGE_BUCKET: "synthetic-kiliride-staging", STORAGE_EXPECTED_BUCKET: "synthetic-kiliride-staging",
  STORAGE_REGION: "synthetic-1", STORAGE_PREFIX: "staging/vehicle-images/", STORAGE_ACCESS_KEY_ID: "synthetic-access-key", STORAGE_SECRET_ACCESS_KEY: "synthetic-secret-key-not-real-credentials",
};
export function syntheticS3(store: ImageStorage) {
  const state = { public: false, versioned: true, failDelete: false, lostPutResponse: false, hangGet: false, oversize: false, truncated: false, calls: 0 };
  const keys = new Set<string>();
  const client = new S3Client({ endpoint: syntheticStorageEnv.STORAGE_ENDPOINT, region: "synthetic-1", forcePathStyle: true, maxAttempts: 1,
    credentials: { accessKeyId: syntheticStorageEnv.STORAGE_ACCESS_KEY_ID, secretAccessKey: syntheticStorageEnv.STORAGE_SECRET_ACCESS_KEY },
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED",
    requestHandler: { async handle(request: { hostname: string; protocol: string; headers: Record<string, string>; query?: Record<string, unknown>; path: string; method: string; body?: unknown }, options?: { abortSignal?: AbortSignal }) {
      state.calls++;
      assert.equal(request.hostname, "objects.provider.example"); assert.equal(request.protocol, "https:");
      assert.match(request.headers.authorization, /^AWS4-HMAC-SHA256 /);
      const query = request.query ?? {};
      const xml = (body: string, statusCode = 200) => ({ response: { statusCode, headers: { "content-type": "application/xml" }, body: Readable.from([body]) } });
      if ("publicAccessBlock" in query) return xml(`<PublicAccessBlockConfiguration><BlockPublicAcls>true</BlockPublicAcls><IgnorePublicAcls>true</IgnorePublicAcls><BlockPublicPolicy>true</BlockPublicPolicy><RestrictPublicBuckets>true</RestrictPublicBuckets></PublicAccessBlockConfiguration>`);
      if ("policyStatus" in query) return xml(`<PolicyStatus><IsPublic>${state.public}</IsPublic></PolicyStatus>`);
      if ("acl" in query) return xml('<AccessControlPolicy><Owner><ID>synthetic-owner</ID></Owner><AccessControlList><Grant><Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser"><ID>synthetic-owner</ID></Grantee><Permission>FULL_CONTROL</Permission></Grant></AccessControlList></AccessControlPolicy>');
      if ("versioning" in query) return xml(`<VersioningConfiguration><Status>${state.versioned ? "Enabled" : "Suspended"}</Status></VersioningConfiguration>`);
      if ("list-type" in query) return xml(`<ListBucketResult><IsTruncated>false</IsTruncated>${[...keys].map(key => `<Contents><Key>staging/vehicle-images/${key}</Key></Contents>`).join("")}</ListBucketResult>`);
      const key = decodeURIComponent(request.path.split("/").at(-1)!);
      if (request.method === "PUT") {
        assert.equal(request.headers["if-none-match"], "*"); assert.equal(request.headers["x-amz-server-side-encryption"], "AES256");
        assert.equal(request.headers["x-amz-acl"], undefined); assert.equal(request.headers["cache-control"], "private, no-store");
        const bytes = Buffer.from(request.body as Uint8Array);
        assert.equal(request.headers["x-amz-checksum-sha256"], createHash("sha256").update(bytes).digest("base64"));
        try { await store.get(key); return xml('<Error><Code>PreconditionFailed</Code></Error>', 412); } catch { /* absent */ }
        await store.put(key, bytes); keys.add(key);
        if (state.lostPutResponse) throw new Error("Synthetic ambiguous PUT response containing provider secret");
        return xml("");
      }
      if (request.method === "DELETE") {
        if (state.failDelete) return xml('<Error><Code>AccessDenied</Code></Error>', 403);
        await store.remove(key); keys.delete(key); return xml("", 204);
      }
      try {
        if (state.hangGet) await new Promise<void>((_resolve, reject) => {
          if (options?.abortSignal?.aborted) reject(new Error("Aborted"));
          else options?.abortSignal?.addEventListener("abort", () => reject(new Error("Aborted")), { once: true });
        });
        const bytes = await store.get(key);
        return { response: { statusCode: 200, headers: { "content-type": "image/webp", "content-length": String(state.oversize ? 6 * 1024 * 1024 : bytes.length + (state.truncated ? 1 : 0)) }, body: Readable.from([bytes]) } };
      } catch { return xml('<Error><Code>NoSuchKey</Code></Error>', 404); }
    } },
  });
  return { client, state, keys };
}
