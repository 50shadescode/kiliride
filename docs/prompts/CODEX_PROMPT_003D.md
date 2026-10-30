# CODEX TASK 003D — Vehicle photographs and private storage

Authority: explicit user authorization for Milestone 2D only. Read root AGENTS.md, CODEX_PROMPT_003.md and the Phase 2 architecture/data model/reports first. Preserve completed identity, fleet and host management, stable public routes, prices and WhatsApp enquiries.

Implement multiple photographs per owned vehicle; server-side image validation; cover selection and ordering; secure deletion/replacement; protection of unpublished images; responsive accessible HOST management; database/storage consistency and security/regression tests.

Local scope: private filesystem adapter outside public/, with separate dev/test namespaces bound to guarded database targets. Do not invent production provider credentials. Keep the storage interface suitable for a later private object-store adapter. Decode JPEG/PNG/WebP within explicit byte/pixel limits, reject animation/unsupported or malformed input, normalize orientation, strip metadata and store only re-encoded images under server-generated keys. Never trust filenames, browser MIME, owner IDs or storage paths.

Only current verified-email HOST owners may read or mutate their images. All images remain private in 2D, including approved listings; public integration is deferred. DRAFT/REJECTED may be changed; rejected changes return to DRAFT and retain review history. Pending/approved/suspended listings remain read-only. Use the vehicle revision lock for photo changes and submission races. Record audit events and recover interrupted storage operations with a durable journal; do not serve incomplete or deleted objects.

Add safe migrations only after backup/rehearsal. Test authorization/IDOR, CSRF, limits, malformed/forged images, metadata stripping, ordering/cover invariants, replacement/deletion, failure compensation/reconciliation, concurrent mutations and lifecycle restrictions. Run schema/migration checks, TypeScript, strict ESLint, unit/database/browser suites, production build and dependency audit. Keep tests on port 55433 and isolated test storage. Update docs/KILIRIDE_PHASE2_REPORT.md with actual outcomes, files, limitations and recovery instructions.

Do not implement admin approval screens, public DB catalogue cutover, private verification-document uploads, payments or reservations. No commits, pushes, deployment or Phase 2E. STOP after 2D for review.
