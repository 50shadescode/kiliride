import "server-only";
import { assertLocalDatabase } from "../../../scripts/local-safety.mjs";
// Formal authorization is still pending. No real version is authorized by 2F.
// Changing this register requires explicit business approval, not a browser flag.
const authorizedRealPolicyVersions: readonly string[] = [];
export function activeVerificationPolicy(policy: { version: string; enabled: boolean; approvedAt: Date; testOnly: boolean } | null) {
  if (!policy?.enabled || policy.approvedAt > new Date() || /draft/i.test(policy.version)) return false;
  if (!policy.testOnly) return authorizedRealPolicyVersions.includes(policy.version);
  try { assertLocalDatabase(process.env.DATABASE_URL, true); return true; } catch { return false; }
}
