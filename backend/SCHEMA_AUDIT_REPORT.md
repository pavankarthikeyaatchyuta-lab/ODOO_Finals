# Schema and backend follow-up audit

Verified **31 October 2026**, on existing `main`, starting from `30e4f85`. This follows the completed Phase 6 review and the authorized attribution correction. The review covers all **37 Prisma business models**, existing migrations, database constraints/indexes/permissions, backend workflows and contracts, CI/deployment configuration and frontend build/contract compatibility.

## Fixed

1. **Database document ownership:** Agreements, signed agreements, payment evidence, extra-expense evidence and vendor bills previously linked a document only by document UUID. The APIs checked wedding ownership, but SQL did not. All five references now use `(documentId, weddingId)` equivalents against a unique document/wedding key. Cross-wedding references are rejected in PostgreSQL.
2. **Foreign-key lookup indexes:** Added missing indexes for document references, procurement categories/vendors, timeline functions, arrival functions, schedule events and notification recipients. The database test inventories every business foreign key and verifies a valid non-partial index starts with its lookup column. Existing suitable indexes are reused.
3. **Payment reversal evidence:** PostgreSQL CHECK expressions can accept UNKNOWN when a nullable expression is used. The payment rule now explicitly requires reversal notes and original review metadata; unreviewed and non-reversed states must not carry incompatible review/reversal fields. A direct invalid reversal is rejected and the payment remains VERIFIED.
4. **Large report totals:** Valid stored payments could sum above the response schema's 14-integer-digit limit and cause a 500. Response totals now use exact two-decimal strings without that single-column limit. Individual amount inputs and stored columns remain bounded. Tests verify two fictional INR payments of `90000000000000.00` produce the exact total string `180000000000000.00` without allowing an oversized individual payment.
5. **Incorrect client dues:** Excess cash against one milestone could leave another milestone displayed as due despite the contract being fully paid. Dashboard milestone dues now consume at most the actual outstanding receivable, in due-date order. Individual payment/milestone history is retained; no original receipt is reclassified. Tests verify both a partial remaining balance and a fully paid contract.
6. **Enquiry mutation consistency:** Enquiry changes and assignment now lock/recheck the wedding before writing and reject closed weddings. Stage audit values are read after the lock, preserving accurate history under concurrent changes.
7. **Consultation authorization consistency:** All consultation decisions now lock/recheck wedding access before locking the consultation. This also keeps lock order consistent with other wedding workflows. The existing concurrent overlap, rescheduling, cancellation and access tests continue to pass.

## Migration safety

New migration: `prisma/migrations/202610310010_schema_audit/migration.sql`. Previous migrations are unchanged. It adds indexes, replaces five document foreign keys with stronger composite foreign keys and tightens the existing payment check. It contains **no business-row DELETE/UPDATE, database reset or database drop**.

The entire new migration is wrapped in `BEGIN/COMMIT`. A conflicting legacy row rolls back all its DDL, restoring the prior constraints and avoiding a partially upgraded schema.

Two different disposable loopback databases verify the release:

- Fresh database: Prisma applies all ten migrations, repeats deploy safely, then compares the database with `schema.prisma` and reports no drift.
- Upgrade database: released migration SQL 0001–0009 creates a legacy schema with fictional existing rows. An intentionally inconsistent document link makes migration 0010 fail; old foreign keys remain and newly created indexes roll back. After an explicit fixture correction, migration 0010 succeeds and snapshots of all pre-existing fixture business rows are unchanged. The fixture's stand-in migration bookkeeping table is not presented as a real release history; Prisma migration history is verified separately on the fresh database.

No existing local/hosted business database was migrated. Before a hosted release, verify the target, backup and migration history, review cross-wedding document links and payment review/reversal metadata, and resolve inconsistent data through an authorized process. Do not reset the database to bypass a migration failure.

## Validation results

| Check | Result |
| --- | --- |
| Prisma schema validation | PASS; temporary loopback URL placeholders resolve configuration without connecting |
| Prisma Client generation and backend production build | PASS |
| TypeScript validation including tests/scripts | PASS |
| Isolated integration/security/workflow/upgrade tests | **91 passed, 0 failed, 0 skipped** |
| Fresh and repeated migration deploy | PASS; all ten migrations applied, no pending migrations on repeat |
| Prisma schema/database drift | PASS; no difference detected |
| All foreign keys validated and lookup paths indexed | PASS |
| All business tables have RLS/backend-only policy and no browser grants | PASS |
| Restricted runtime role, immutable policy/rate/audit/cache permissions | PASS |
| Cross-wedding document links and incomplete reversal rejected by database | PASS |
| Existing-data upgrade and transactional rollback | PASS |
| Generated OpenAPI matches registered schemas/routes | PASS |
| Full fictional 25-step Udaipur wedding workflow and independent money assertions | PASS; existing end-to-end regression retained |
| Frontend production build | PASS; existing bundle-size warning |
| Frontend lint | Exit 0; existing unused-variable/import warnings |
| Backend dependency audit, including development dependencies | 0 known vulnerabilities reported |
| Frontend dependency audit, including development dependencies | 0 known vulnerabilities reported |
| Staged diff and ownership review | Backend-owned changes only; no frontend or other developer changes staged |

The first plain `prisma validate` attempt reported missing `DIRECT_URL` in local configuration. This is a required migration/admin environment setting, not a schema relation error. The `.env` file was preserved. Runtime requests still use the restricted `DATABASE_URL`; tests generate their own database URLs.

## Files and contracts

- `prisma/schema.prisma` and migration 0010: document/wedding keys, references, indexes and payment evidence.
- `src/finance-contracts.ts`, `src/services/finance.ts`, `openapi.json`: exact aggregate response types and capped client dues.
- `src/routes/enquiries.ts`, `src/routes/consultations.ts`: scope rechecks and wedding locking.
- `tests/qa.test.ts`: new database/report/workflow regressions; migration inventory updated to ten.
- `tests/migration-upgrade.test.ts`, `scripts/test.ts`: existing-data upgrade and failure rollback test, integrated with the isolated runner.
- `docs/archive/phase-reports/PHASE_5_API.md`, `DEPLOYMENT.md`, this report: response/dues semantics, environment setup and migration release guidance.

No dependencies added. Existing endpoints, permissions, UUID identities, request body limits and input amount precision are preserved. Authoritative totals remain server calculations using decimal arithmetic. Updated shared contracts remain available to Antigravity through `openapi.json` and the TypeScript contract modules.

## Remaining integration/configuration work

The frontend still uses demo login/localStorage for business actions. Its successful build does **not** mean live API integration or secure hosted login is complete. The exact mappings and integration sequence remain in `docs/archive/phase-reports/PHASE_6_INTEGRATION_AUDIT.md`. No Antigravity source was overwritten.

Hosted Supabase credentials/pooler settings, real invitation/recovery email delivery, Storage policies and Vercel deployment checks remain pending user configuration. No production-data compatibility or browser end-to-end verification is claimed. No additional history rewriting is used for this fix; the verified changes are committed and pushed normally with Mohan's requested identity, with the final hash and push result reported in the delivery message.
