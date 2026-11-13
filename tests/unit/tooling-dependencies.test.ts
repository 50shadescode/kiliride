import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

test("scoped lint glob fix retains dot/path semantics and bounds hostile pattern preprocessing", () => {
  const require = createRequire(import.meta.url);
  const parserRequire = createRequire(require.resolve("@typescript-eslint/typescript-estree"));
  const matcherPath = parserRequire.resolve("minimatch");
  const { minimatch } = parserRequire("minimatch");
  // The parser uses the named CJS export with { dot: true } for allowDefaultProject.
  for (const [file, pattern, expected] of [
    ["eslint.config.mjs", "*.mjs", true],
    [".hidden.ts", "*.ts", true],
    ["src/app/page.tsx", "src/**/*.tsx", true],
    ["src/app/page.tsx", "*.tsx", false],
    ["src/app/page.tsx", "src/**/*.{ts,tsx}", true],
    ["src/app/page.js", "src/**/*.tsx", false],
  ] as const) assert.equal(minimatch(file, pattern, { dot: true }), expected);
  // Isolate resource-amplifying input so a regression cannot hang the test runner.
  execFileSync(process.execPath, ["-e", `
    const { minimatch } = require(process.argv[1]);
    const assert = require('node:assert/strict');
    const pattern = Array(80).fill('**/../a').join('/');
    assert.throws(() => minimatch('src/file.ts', pattern, { dot: true, optimizationLevel: 2 }),
      { name: 'RangeError', message: /too many patterns/ });
  `, matcherPath], { timeout: 5000, stdio: "pipe" });
});
