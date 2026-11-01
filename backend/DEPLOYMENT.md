# Deployment runbook

## Supabase project

1. Use the supplied project URL in local/server environment configuration. Disable **Allow new users to sign up** in Auth settings. Keep email confirmation enabled. Configure Site URL, exact redirect URLs, invitation/recovery templates and a tested SMTP provider.
2. Obtain owner/session-pooler credentials and a server administrative key through secure environment configuration. The publishable key supplied in chat cannot perform migrations, invite users or configure buckets.
3. Keep `app` out of Data API exposed schemas. Migrations enable RLS on every business table and grant policies only to `rk_backend`. They revoke schema/table access for `anon` and `authenticated`; there are no client write policies.
4. Populate `backend/.env` from `.env.example`. `DIRECT_URL` uses the migration owner over direct or session-mode pooler. `DATABASE_URL` uses `rk_backend` over the transaction pooler, with `schema=app`, `pgbouncer=true`, `connection_limit=3` and production TLS. Preserve connection parameters supplied by Supabase. Use URL-encoded passwords.
5. Run `npm run db:migrate` from `backend/`. This creates the business schema, constraints and a restricted NOLOGIN role. It requires permission to create the `btree_gist` extension in `extensions` and `rk_backend`; provision these with the project administrator if necessary.
6. Set a generated `BACKEND_DB_PASSWORD` of at least 24 characters and run `npm run db:provision`. This enables login for the restricted role and creates/verifies a private `wedding-documents` bucket. It does not grant browser upload/download policies. Confirm no pre-existing Storage policy grants this bucket access to browser roles. Document upload/verification and signed download APIs are implemented; exercise them against the private test bucket before release.
7. Set `FOUNDER_EMAIL` and `FOUNDER_NAME` locally and run `npm run bootstrap:founder`. It refuses to replace an existing founder or escalate an existing non-founder profile. Complete the invitation or recovery flow and verify `/api/v1/me`.

Never put database URLs, passwords or administrative/service-role keys into `VITE_*`, `NEXT_PUBLIC_*`, frontend code, generated contracts or Git. Only the project URL, publishable key and backend API origin belong in the browser.

## Vercel

- Backend project: same GitHub repository, root directory `backend`, Express framework, Node.js **22.x**, install `npm ci`, build `npm run build`. `src/server.ts` imports Express and exports the application. `vercel.json` selects Express; request handlers do not run migrations.
- Set runtime `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS` and `AUTH_REDIRECT_URL` in the backend project. `DIRECT_URL` and provisioning/bootstrap variables belong only in the controlled migration/admin environment; they are not required by request handlers.
- Frontend project: same repository, root `frontend`, Vite preset. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_API_URL` (including `/api/v1`). Frontend source is owned by Antigravity. Its current demo service still requires real API/authentication wiring; see `docs/archive/phase-reports/PHASE_6_INTEGRATION_AUDIT.md` before treating a deployed UI as live-integrated.
- `ALLOWED_ORIGINS` is a comma-separated list of exact frontend origins. `AUTH_REDIRECT_URL` must use one of them and be allowlisted in Supabase. Explicitly configure preview origins/callbacks; do not use wildcard production CORS.
- Remote Supabase URLs and frontend origins must use HTTPS. HTTP is accepted only for loopback development (`localhost`, `127.0.0.1`, `::1`). Supabase URLs must be origins without embedded credentials, query strings or fragments. The hosted backend API must also be accessed through HTTPS.
- Choose backend/database regions close together. No persistent worker, WebSocket server, local uploaded files or in-memory session store is required for Phase 1. Idempotency and audit data are in PostgreSQL.

## Release checks

Run `npm ci`, `npm run typecheck`, `npm run build`, `npm test` and `npm audit`. Apply migrations explicitly before releasing compatible API code. Check `/api/v1/health` and `/api/v1/ready` on the hosted backend. Smoke-test invite/password setup, login, recovery, refresh/logout, disabled accounts and one invited client across two distinct weddings. Test browser Data API writes are denied and the document bucket is private.

Health confirms the process is serving; readiness confirms the migrated UserProfile table is reachable. Logs include a request ID and safe error classification, not credentials or full request bodies. Investigate elevated 5xx/auth/database failures in Vercel and Supabase logs. Roll back application deployments only to schema-compatible versions; do not reset shared databases to undo a release.

Hosted verification is pending until server credentials, Vercel access, frontend origins and email delivery are configured. A local test pass is not evidence of a successful hosted deployment.

## Schema audit follow-up

Migration `202610310010_schema_audit` strengthens document links to include the wedding UUID, adds missing foreign-key lookup indexes and tightens payment reversal evidence. It uses an explicit transaction: a conflicting legacy document link rejects the migration and rolls back its DDL, preserving the previous schema. It does not delete or rewrite business rows. Review existing document/wedding links and payment review/reversal metadata before an authorized hosted release; correct inconsistent records through a reviewed workflow rather than resetting the database. The upgrade regression verifies both rollback on an inconsistent legacy link and successful migration of valid existing rows without changing their contents.

`prisma validate` requires both `DATABASE_URL` and `DIRECT_URL` to resolve the schema configuration. Set these through your local/admin environment following `.env.example`; never commit their real values. Runtime requests still use only the restricted `DATABASE_URL`. Tests supply their own generated loopback URLs and never target the local `.env` database.

## Phase 6 release status

There are nine versioned migrations through `202610310009_financial_integrity`. The isolated test runner applies them to a new local database, reapplies deploy safely, checks schema drift, validates backend/browser privileges and runs the complete fictional wedding scenario. It never uses the database in the local `.env` as its test target.

Migration 0009 adds integrity checks without deleting business records and removes unused UPDATE grants on approved policy/rate tables. Before applying to an existing hosted database, verify the intended project/host, back up data, inspect migration status and review any pre-existing rows that violate the new calculations or review-evidence rules. Do not reset/drop the database or modify already-applied migration files to bypass a failure. No hosted migration was run during this implementation.

Use Node **22.x** as pinned by `backend/package.json` and CI. Run build and integration tests sequentially on Windows; Prisma generation replaces a native DLL that cannot be overwritten while another test process has it loaded. The temporary test-cluster cleanup verifies its absolute target and retries transient Windows file locks.

The application uses a low runtime connection limit per Vercel process and a pooled database URL. Review total concurrency against the project's connection limits. Authentication attempt limits use the socket peer address rather than trusting arbitrary forwarded headers; confirm proxy behavior and configure trusted edge rate limiting for the hosted deployment. No external payment gateway, bank feed, e-sign provider or WhatsApp delivery is implemented. In-app vendor acknowledgements require the recipient's explicit response.

Deployment configuration follows [Vercel's Express guidance](https://vercel.com/docs/frameworks/backend/express) and [Supabase's Prisma guidance](https://supabase.com/docs/guides/database/prisma). The local compiled default-export app smoke check passes health 200 and safe readiness 503 when the database is unavailable; healthy database readiness 200 is covered by isolated integration tests. Hosted checks remain separate.
