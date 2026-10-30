import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";

test("Playwright refuses an occupied test server before running browser flows", { timeout: 30000 }, async () => {
  const paths: string[] = [];
  const server = createServer((request, response) => {
    paths.push(request.url ?? "");
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Untrusted pre-existing test server");
  });
  server.listen(3100, "localhost");
  await once(server, "listening");
  try {
    const child = spawn(process.execPath, ["scripts/run.mjs", "test", "frontend.spec.ts", "--grep", "identity forms expose"], {
      env: { ...process.env, CI: "", TEST_DATABASE_URL: "postgresql://127.0.0.1:55433/kiliride_test" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { output += chunk; });
    const timeout = setTimeout(() => child.kill(), 20000);
    try {
      const [code] = await once(child, "close");
      assert.equal(code, 1);
      assert.match(output, /already used/);
      assert.ok(paths.length > 0, "Playwright must probe the occupied server");
      assert.ok(paths.every(path => path === "/login"), "No test flow may reach the existing server");
    } finally { clearTimeout(timeout); }
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
