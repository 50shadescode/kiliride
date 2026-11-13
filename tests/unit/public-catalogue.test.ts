import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogueQuerySchema, publicIdSchema } from "../../src/lib/validation/public-catalogue";
test("catalogue queries bound result sizes, filters and slugs without authority overrides", () => {
  assert.equal(catalogueQuerySchema.parse({}).pageSize, 12);
  for (const input of [{ pageSize: 25 }, { pageSize: 0 }, { page: 1001 }, { q: "x".repeat(101) }, { status: "APPROVED" }, { policyVersion: "test" }, { ownerId: "any" }, { sort: "id;drop" }]) assert.equal(catalogueQuerySchema.safeParse(input).success, false);
  for (const id of ["../secret", "<script>", "x".repeat(101)]) assert.equal(publicIdSchema.safeParse(id).success, false);
  for (const id of ["vitz-142s", "note-131c"]) assert.equal(publicIdSchema.safeParse(id).success, true);
});
