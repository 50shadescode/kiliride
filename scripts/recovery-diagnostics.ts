import { mkdir, lstat, realpath } from "node:fs/promises";
import path from "node:path";

// The ignored backup parent is absent on a fresh checkout. Create only the
// parent idempotently; each run directory remains exclusive and is never reused.
export async function createRecoveryDirectory(root: string) {
  const parent = path.dirname(root);
  await mkdir(parent, { recursive: true, mode: 0o700 });
  const stat = await lstat(parent);
  const resolved = await realpath(parent);
  const same = process.platform === "win32" ? resolved.toLowerCase() === parent.toLowerCase() : resolved === parent;
  if (!stat.isDirectory() || stat.isSymbolicLink() || !same) throw new Error("Unsafe recovery artifact parent.");
  await mkdir(root, { recursive: false, mode: 0o700 });
}

export function sanitizeRecoveryText(value: string, env: Record<string, string | undefined> = process.env) {
  let text = value;
  const secrets = new Set<string>();
  for (const [key, value] of Object.entries(env)) {
    if (!value || !/PASSWORD|SECRET|TOKEN|KEY|DATABASE_URL|AUTHORIZATION|COOKIE/i.test(key)) continue;
    secrets.add(value);
    try { const url = new URL(value); if (url.password) { secrets.add(url.password); secrets.add(decodeURIComponent(url.password)); } } catch { /* Not a URL. */ }
  }
  for (const secret of [...secrets].sort((a, b) => b.length - a.length)) text = text.split(secret).join("[REDACTED]");
  return text
    .replace(/\x1b\[[0-9;]*m/g, "")
    .replace(/\b(?:postgres(?:ql)?|https?):\/\/[^\s'"<>]+/gi, "[REDACTED_URL]")
    .replace(/\b(?:authorization|cookie|set-cookie)\s*[:=][^\r\n]*/gi, "[REDACTED_HEADER]")
    .replace(/\b(password|secret|token|access[_-]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .replaceAll(process.cwd(), "<workspace>")
    .slice(0, 3000);
}

type ProcessResult = { status: number | null; signal: string | null; error?: Error; stderr: string | Buffer | null; stdout?: string | Buffer | null };
export class RecoverySubprocessError extends Error {
  readonly operation: string;
  readonly result: ProcessResult;
  constructor(operation: string, result: ProcessResult) {
    super(`${operation} subprocess failed`);
    this.name = "RecoverySubprocessError";
    this.operation = operation;
    this.result = result;
  }
}
export function requireRecoverySubprocess(operation: string, result: ProcessResult) {
  if (result.error || result.status !== 0) throw new RecoverySubprocessError(operation, result);
}
export function recoveryDiagnostic(stage: string, error: unknown) {
  const e = error instanceof Error ? error : new Error("Non-Error failure (details omitted).");
  const system = e as NodeJS.ErrnoException;
  // Assertion messages can contain complete actual/expected database rows. Keep
  // assertion identity/operator, never serialize those values, stacks or causes.
  const assertion = e.name === "AssertionError";
  return {
    result: "FAIL", stage, error: {
      name: e.name, code: system.code, syscall: system.syscall,
      message: assertion ? "Recovery validation assertion failed; compared values omitted." : sanitizeRecoveryText(e.message),
      ...(assertion ? { operator: (e as Error & { operator?: string }).operator } : {}),
    },
    ...(e instanceof RecoverySubprocessError ? { subprocess: {
      operation: e.operation, exitCode: e.result.status, signal: e.result.signal,
      spawnError: e.result.error ? { code: (e.result.error as NodeJS.ErrnoException).code, message: sanitizeRecoveryText(e.result.error.message) } : undefined,
      stderr: sanitizeRecoveryText(e.result.stderr?.toString() ?? ""),
      // Only Prisma's textual diagnostics; never print binary pg_dump output.
      ...(e.operation === "prisma-migrate-deploy" && typeof e.result.stdout === "string" ? { stdout: sanitizeRecoveryText(e.result.stdout) } : {}),
    } } : {}),
    existingDestinationsOverwritten: false,
  };
}
