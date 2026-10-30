import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateRentalDays, calculateEstimatedRentalFee, calculateEstimatedTotal } from "../../src/lib/helpers/pricing";
import { KILIFI_FLEET } from "../../src/lib/fleet";
import { assertLocalDatabase, assertLocalHttp } from "../../scripts/local-safety.mjs";

test("legacy full-day quote and stable catalogue identifiers", () => {
  assert.deepEqual(KILIFI_FLEET.map(v => v.id), ["vitz-142s", "note-131c"]);
  const days = calculateRentalDays("2026-10-29", "2026-11-01");
  assert.equal(days, 3);
  assert.equal(calculateEstimatedTotal(calculateEstimatedRentalFee(KILIFI_FLEET[0], days), 500), 11000);
});

for (const tz of ["Africa/Nairobi", "America/New_York", "Europe/London"]) {
  test(`legacy date boundaries in ${tz}`, () => {
    const previous = process.env.TZ;
    process.env.TZ = tz;
    try {
      for (const [start, end, expected] of [
        ["2026-11-01", "2026-11-02", 1], ["2026-03-08", "2026-03-09", 1],
        ["2028-02-28", "2028-03-01", 2], ["2026-10-29", "2026-10-29", 0],
        ["2026-10-30", "2026-10-29", 0], ["", "2026-10-29", 0], ["invalid", "2026-10-29", 0],
      ] as const) assert.equal(calculateRentalDays(start, end), expected);
    } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
  });
}

test("test database guard requires loopback, kiliride_test and explicit port 55433", () => {
  assertLocalDatabase("postgresql://localhost:55433/kiliride_test", true);
  assertLocalDatabase("postgresql://127.0.0.1:55433/kiliride_test", true);
  for (const url of [undefined, "postgresql://production.example:55433/kiliride_test", "postgresql://127.0.0.1:55433/kiliride_dev", "postgresql://127.0.0.1:55433/kiliride_test?host=remote", "https://127.0.0.1:55433/kiliride_test", "postgresql://127.0.0.1:55432/kiliride_test", "postgresql://127.0.0.1:5432/kiliride_test", "postgresql://127.0.0.1/kiliride_test", "postgresql://127.0.0.1:55433/other"]) {
    assert.throws(() => assertLocalDatabase(url, true));
  }
  assert.throws(() => assertLocalHttp("https://mail.example"));
});
