# Phase 2F security closeout — MVP release task 001

Date: 2026-11-13 (Africa/Nairobi). Scope: B02 dependency security and B01 local checkpoint preparation. Final verification results are recorded in `KILIRIDE_TEST_REPORT.md`. Production readiness remains BLOCKED by the separate MVP launch gates.

## Inspected checkpoint and preserved work

Branch confirmed `feature/phase2-fleet-management`; HEAD remains `4571bdc222ca01e1766eab370185be821bb72090` (Phase 2E). No reset, clean, branch switch, staging, commit or push. Existing Phase 2F work was retained.

Initial modified tracked files: `.env.example`, `docs/KILIRIDE_ARCHITECTURE.md`, `docs/KILIRIDE_DATA_MODEL.md`, `docs/KILIRIDE_DECISIONS.md`, `docs/KILIRIDE_PHASE2_REPORT.md`, `docs/KILIRIDE_RELEASE_CHECKLIST.md`, `docs/KILIRIDE_ROADMAP.md`, `docs/KILIRIDE_TEST_REPORT.md`, `next.config.ts`, `package.json`, `scripts/run.mjs`, `src/app/page.tsx`, `src/app/services/vehicles/page.tsx`, `src/app/vehicles/[id]/page.tsx`, `src/components/bookings/ReservationForm.tsx`, `src/components/cars/CarCard.tsx`, `src/lib/helpers/pricing.ts`, `src/server/fleet/service.ts`.

Initial untracked files: `docs/KILIRIDE_MVP_LAUNCH_GAP_REPORT.md`, `docs/prompts/CODEX_PROMPT_003F.md`, `playwright.catalogue.config.ts`, the three `src/app/api/public/vehicles/**/route.ts` handlers, `src/app/vehicles/[id]/error.tsx`, `src/components/cars/{Catalogue,CatalogueFilters,PublicPhoto}.tsx`, `src/lib/types/public-vehicle.ts`, `src/lib/validation/public-catalogue.ts`, `src/server/fleet/{catalogue-config,policy,public-http,public}.ts`, `tests/catalogue/public.spec.ts`, `tests/database/catalogue.test.ts`, `tests/helpers/catalogue-fixtures.ts`, `tests/integration/catalogue-off.spec.ts`, `tests/unit/public-catalogue.test.ts`. The MVP report is the preceding audit artifact, not a 2F feature implementation.

No changes to schema/migrations, auth, catalogue eligibility, photo service, flag default/production denial, policy authorization register, inventory, pricing or WhatsApp code in this task. Tests may create explicitly synthetic test records; no real approval or public catalogue activation occurred.

## Audit evidence and remediation

Node **v24.14.1**, npm **11.11.0**. Explicit online full audit before remediation: **15 findings (3 high, 11 moderate, 1 low, zero critical)**. Runtime-only: **zero**. Counts are npm affected-package totals, including aggregate chains, not counts of independent exploits. Initial registry commands use `--offline=false --fetch-retries=0 --fetch-timeout=20000`; no offline empty result is treated as evidence.

The application directly resolves Zod **4.6.7**, which was not flagged. The high Zod finding was **3.25.76 nested under shadcn 3.8.5**. No runtime exploit is demonstrated by a tooling dependency audit.

### Why the CLI was removed, and what was retained

Repository searches of `src`, scripts, tests, workflow, README and package scripts found no CLI invocation or JavaScript import of shadcn. Existing components are local source using Radix and other independently declared packages. However, `src/app/globals.css` imported `shadcn/tailwind.css`; removing the package alone would break compilation/styles.

Copied the installed **3.8.5** `dist/tailwind.css` byte-for-byte to `src/styles/shadcn-tailwind.css`, retained its complete MIT notice in `src/styles/shadcn-LICENSE.md`, and changed only that CSS import. The stylesheet contains accordion keyframes, data-state variants and no-scrollbar utility, no executable CLI dependencies. `components.json` remains unchanged for provenance/design configuration. Future generator use requires a separately reviewed version; ordinary install/build/test requires no shadcn CLI.

Removed shadcn from devDependencies using npm's lockfile resolution, preserving the lockfile rather than regenerating it from scratch. Its unused MCP/Hono, ts-morph, deepmerge and nested Zod trees disappeared. The lock comparison removes **250 package entries**, adds one dependency required by the reviewed minimatch fix, and otherwise changes only the targeted versions below. No forced fix, tooling downgrade, Prisma/Next/auth upgrade or top-level major upgrade.

### Targeted compatibility review

- `brace-expansion` **1.1.12 → 1.1.22** under unchanged minimatch 3.1.5: within the parent's `^1.1.7` range. The other retained branch advances **5.0.12 → 5.0.13**, within `^5.0.12`.
- Remaining moderate minimatch chain: `eslint-config-next@16.4.3 → typescript-eslint@8.56.1 → @typescript-eslint/typescript-estree@8.56.1 → minimatch@10.2.6`. Registry inspection found no patched 10.x version. A **reviewed, narrowly scoped transitive major override to 11.0.8** is confined to `@typescript-eslint/typescript-estree`; minimatch 3 users are untouched.
- Inspected parser call site `dist/useProgramFromProjectService.js`: named CommonJS `minimatch(filePath, pattern, { dot: true })` for configured allowDefaultProject patterns. The 11.x package retains the named CJS export and matching options; 11.0.8 supports Node `20 || >=22`, including required Node 24. No KiliRide `allowDefaultProject` or attacker-supplied pattern configuration exists in `eslint.config.mjs`.
- New transitive dependency `@isaacs/nonrecursive-glob-match@1.1.0` is required by minimatch 11, scoped to lint tooling and not an application dependency.
- Added `tests/unit/tooling-dependencies.test.ts`: resolves minimatch from the actual parser dependency, checks dot/path/extension semantics and runs hostile optimization-level-2 preprocessing in a child with a five-second kill timeout. New 11.0.1 initially timed out despite a clean advisory audit; it was **not accepted**. Current 11.0.8 has explicit pattern/cell bounds and raises RangeError for the same input. The test now asserts that specific safe rejection, preserving the hostile input and timeout. This is stronger than assuming npm's first patched version proves safety.
- Upstream [advisory GHSA-g3hv-75wg-m249](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249) describes amplification with `optimizationLevel >= 2`. The inspected parser uses the default level, not level 2; nevertheless the vulnerable package was removed from its dependency path.

### Advisory register

The following assessments concern inspected usage; they do not assert that a vulnerable library is universally unexploitable. No malicious payload was sent to a real user/service.

| Affected package/path before | Advisory IDs | Reachability / actual exploitability assessment | Fix availability and disposition |
|---|---|---|---|
| ESLint/config/plugins → minimatch 3.1.5 → brace-expansion 1.1.12 | GHSA-f886-m6hf-6m8v; GHSA-3jxr-9vmj-r5cp; GHSA-mh99-v99m-4gvg; GHSA-rgw5-rvv9-x895; GHSA-q2hr-2g5m-vwhr; GHSA-qhr7-859c-m2p7; GHSA-6j4f-fj2g-mc7p | Glob expansion resource exhaustion in developer/CI tooling with attacker-controlled patterns. No public request path found; untrusted repository/configuration input remains a tooling risk. | Compatible patch available; updated to 1.1.22. No global minimatch major override. |
| shadcn → nested zod 3.25.76 | GHSA-mrhx-c7xc-m3w5 | Oversized constrained collections can exhaust memory if passed to vulnerable validation. CLI not invoked by build/runtime; no public request reaches this nested instance. | npm proposed shadcn 1.0.0 major downgrade; rejected. Removed unused CLI and nested instance; application Zod unchanged. |
| shadcn → deepmerge 4.3.1 | GHSA-gcqx-w48m-w2h4 | Prototype poisoning when merging hostile objects. Reachable if CLI consumes untrusted registry/config inputs, not through inspected application imports. | npm proposed CLI downgrade; removed chain instead. |
| shadcn → @modelcontextprotocol/sdk → @hono/node-server 1.19.17 | GHSA-rmxm-3fg6-px4f; GHSA-jpvv-r467-5p4w | Double path decoding/backslash interpretation can bypass relevant static middleware/proxy checks if server is run. No shadcn MCP/Hono server configured or executed by KiliRide scripts. | npm reports fix available; entire unused server chain removed. No provider or MCP server activated. |
| shadcn → @modelcontextprotocol/sdk → hono 4.13.14 | GHSA-4m76-xfj5-7975; GHSA-h7mg-cq63-vhpq; GHSA-3gg2-335m-rxc6; GHSA-46wx-v44x-9hh2; GHSA-4h7h-rv7c-7m2v | Mounted/wildcard middleware bypasses, CSS interpolation injection, CSRF ping and multipart validation defects depend on relevant Hono handlers. App uses Next routes, not these handlers. | npm reports fix available; removed unused chain. |
| shadcn → ts-morph 26.0.0 → @ts-morph/common 0.27.0 → minimatch 10.2.6 | GHSA-g3hv-75wg-m249 | Glob amplification in CLI analysis; no CLI invocation found. | Removed chain. |
| eslint-config-next → TypeScript-ESLint packages → minimatch 10.2.6 | GHSA-g3hv-75wg-m249 | Parser patterns are developer configuration; inspected call does not set vulnerable optimization level. No remote-renter input path. Resource-amplifying upstream path nevertheless tested. | No fixed 10.x found. Reviewed scoped 11.0.8 override, semantic tests and full strict lint; 11.0.1 rejected after timeout. |
| Aggregate npm entries: shadcn, @ts-morph/common, ts-morph, typescript-eslint, @typescript-eslint/{eslint-plugin,parser,type-utils,typescript-estree,utils} | Inherited IDs above; no additional independent advisory ID | Parent advisories are propagated from dependencies, not independent evidence of app exploitability. | Eliminated by removal or scoped fix; no findings hidden/waived. |

Audit JSON retained locally under ignored `backups/release001-{audit,runtime}-{before,after}.json`; final commands/counts are in the test report. Advisory descriptions and paths are recorded here so the checkpoint does not depend on publishing private backups. The initial PowerShell UTF-16 audit file caused a Node JSON parsing error; PowerShell successfully parsed it for the baseline. This was an evidence-reader error, not a successful clean audit or package failure.

## CI risk policy

`.github/workflows/ci.yml` now independently runs explicitly online runtime and full audits with `--audit-level=low`. Both execute unless the job is cancelled, so failure of one does not suppress the other's report. Registry errors fail the gate. **Zero accepted advisories; no allowlist, suppression or approved exception exists.** This is the strict implementation of the requested security gate, not an invented business risk acceptance.

If a future finding cannot be fixed safely, leave CI blocking and prepare a documented scope/reachability assessment, compensating controls, named owner and requested expiry for actual approval. Do not silently change thresholds or invent an approver. No unresolved exception or expiry is needed for the final zero-finding tree.

Hosted CI for this candidate remains pending the separately authorized commit/push. The prior 2E run cannot certify these modifications. The test report distinguishes local PASS from pending B01 hosted evidence.

## Files introduced/modified by this closeout

- `package.json`, `package-lock.json`: remove unused CLI, scoped reviewed override, targeted patches; retain existing 2F integration script.
- `src/app/globals.css`, new `src/styles/shadcn-tailwind.css`, `src/styles/shadcn-LICENSE.md`: preserve stylesheet and license without the CLI.
- New `tests/unit/tooling-dependencies.test.ts`: compatibility and bounded hostile-pattern check.
- `.github/workflows/ci.yml`: full and runtime zero-advisory online gates.
- This security report, `docs/KILIRIDE_PHASE2_REPORT.md`, `docs/KILIRIDE_TEST_REPORT.md`, and a dated addendum to `docs/KILIRIDE_MVP_LAUNCH_GAP_REPORT.md`: current closeout evidence, retaining historical results.

Ignored diagnostic files in `backups/release001-*` hold local audit/lock/data fingerprints. No credentials or raw database records were copied into the committed documentation. Existing data verification, failures, remaining limitations and final PASS/PARTIAL result are in the test report. No deployment or another milestone is authorized.
