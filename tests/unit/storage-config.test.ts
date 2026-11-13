import { test } from "node:test";
import assert from "node:assert/strict";
import { storageConfig } from "../../src/server/images/config";
import { syntheticStorageEnv } from "../helpers/s3";
test("hosted storage requires explicit private isolated configuration without local fallback", () => {
  assert.equal(storageConfig({}, "development"), undefined);
  assert.equal(storageConfig({ STORAGE_DRIVER: "filesystem" }, "test"), undefined);
  assert.throws(() => storageConfig(syntheticStorageEnv, "test"));
  const config = storageConfig(syntheticStorageEnv, "staging")!;
  assert.equal(config.prefix, "staging/vehicle-images/");
  for (const key of Object.keys(syntheticStorageEnv)) assert.throws(() => storageConfig({ ...syntheticStorageEnv, [key]: undefined }, "staging"));
  for (const override of [{ STORAGE_DRIVER: "filesystem" }, { STORAGE_ENVIRONMENT: "production" }, { STORAGE_PREFIX: "production/vehicle-images/" },
    { STORAGE_ENDPOINT: "http://objects.provider.example" }, { STORAGE_ENDPOINT: "https://127.0.0.1" }, { STORAGE_ENDPOINT: "https://objects.provider.example/?token=secret" },
    { STORAGE_ENDPOINT: "https://user:secret@objects.provider.example" }, { STORAGE_BUCKET: "other-staging" }, { STORAGE_REGION: "bad/region" },
    { STORAGE_SECRET_ACCESS_KEY: "REPLACE_WITH_SECRET_KEY" }, { NODE_TLS_REJECT_UNAUTHORIZED: "0" }]) {
    assert.throws(() => storageConfig({ ...syntheticStorageEnv, ...override }, "staging"), /^Error: Invalid private storage configuration\.$/);
  }
});
