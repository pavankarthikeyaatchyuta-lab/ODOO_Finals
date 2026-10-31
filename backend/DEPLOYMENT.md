# Deployment runbook

## Supabase project

1. Use the supplied project URL in local/server environment configuration. Disable **Allow new users to sign up** in Auth settings. Keep email confirmation enabled. Configure Site URL, exact redirect URLs, invitation/recovery templates and a tested SMTP provider.
2. Obtain owner/session-pooler credentials and a server administrative key through secure environment configuration. The publishable key supplied in chat cannot perform migrations, invite users or configure buckets.
3. Keep `app` out of Data API exposed schemas. Migrations enable RLS on every business table and grant policies only to `rk_backend`. They revoke schema/table access for `anon` and `authenticated`; there are no client write policies.
4. Populate `backend/.env` from `.env.example`. `DIRECT_URL` uses the migration owner over direct or session-mode pooler. `DATABASE_URL` uses `rk_backend` over the transaction pooler, with `schema=app`, `pgbouncer=true`, `connection_limit=3` and production TLS. Preserve connection parameters supplied by Supabase. Use URL-encoded passwords.
5. Run `npm run db:migrate` from `backend/`. This creates the business schema, constraints and a restricted NOLOGIN role. It requires permission to create the `btree_gist` extension in `extensions` and `rk_backend`; provision these with the project administrator if necessary.
6. Set a generated `BACKEND_DB_PASSWORD` of at least 24 characters and run `npm run db:provision`. This enables login for the restricted role and creates/verifies a private `wedding-documents` bucket. It does not grant browser upload/download policies. Confirm no pre-existing Storage policy grants this bucket access to browser roles. Agreement documents and signed download URLs are later-phase work.
7. Set `FOUNDER_EMAIL` and `FOUNDER_NAME` locally and run `npm run bootstrap:founder`. It refuses to replace an existing founder or escalate an existing non-founder profile. Complete the invitation or recovery flow and verify `/api/v1/me`.

Never put database URLs, passwords or administrative/service-role keys into `VITE_*`, `NEXT_PUBLIC_*`, frontend code, generated contracts or Git. Only the project URL, publishable key and backend API origin belong in the browser.

## Vercel

- Backend project: same GitHub repository, root directory `backend`, Express framework, Node.js **22.x**, install `npm ci`, build `npm run build`. `src/server.ts` imports Express and exports the application. `vercel.json` selects Express; request handlers do not run migrations.
- Set runtime `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS` and `AUTH_REDIRECT_URL` in the backend project. `DIRECT_URL` and provisioning/bootstrap variables belong only in the controlled migration/admin environment; they are not required by request handlers.
- Frontend project: same repository, Antigravity's frontend root, Vite preset. Set the public Vite variables and exact API origin. Frontend source and build are owned by Antigravity and are not created by this backend phase.
- `ALLOWED_ORIGINS` is a comma-separated list of exact frontend origins. `AUTH_REDIRECT_URL` must use one of them and be allowlisted in Supabase. Explicitly configure preview origins/callbacks; do not use wildcard production CORS.
- Choose backend/database regions close together. No persistent worker, WebSocket server, local uploaded files or in-memory session store is required for Phase 1. Idempotency and audit data are in PostgreSQL.

## Release checks

Run `npm ci`, `npm run typecheck`, `npm run build`, `npm test` and `npm audit`. Apply migrations explicitly before releasing compatible API code. Check `/api/v1/health` and `/api/v1/ready` on the hosted backend. Smoke-test invite/password setup, login, recovery, refresh/logout, disabled accounts and one invited client across two distinct weddings. Test browser Data API writes are denied and the document bucket is private.

Health confirms the process is serving; readiness confirms the migrated UserProfile table is reachable. Logs include a request ID and safe error classification, not credentials or full request bodies. Investigate elevated 5xx/auth/database failures in Vercel and Supabase logs. Roll back application deployments only to schema-compatible versions; do not reset shared databases to undo a release.

Hosted verification is pending until server credentials, Vercel access, frontend origins and email delivery are configured. A local test pass is not evidence of a successful hosted deployment.
