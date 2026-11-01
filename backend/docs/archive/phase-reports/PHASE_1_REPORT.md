# Phase 1 delivery report — 31 October 2026

## Implemented

Standalone Express/TypeScript backend with Prisma/PostgreSQL models, Supabase identity adapter, invitation-only application access, founder bootstrap, staff administration, wedding assignments, client contacts, separate enquiries and provisional weddings, client-visible projections, consultation requests/decisions, audit history and transactional idempotency.

The central Wedding UUID remains stable. Wedding lifecycle and enquiry stages are separate. The lifecycle enum includes future states, but agreement/booking/planning/execution/financial workflows are not exposed in Phase 1. No later-phase backend workflows were implemented.

PostgreSQL migrations enforce relationships, normalized unique emails, valid amounts/times and concurrent consultation overlap prevention. Business tables are in `app`, with RLS policies only for a restricted backend role. An administrative provisioner configures that role and a private document bucket. Vercel configuration and a GitHub Actions backend check workflow are included.

## Files created

- Root `.gitignore` and `.github/workflows/backend.yml`.
- `backend/package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.test.json`, `.env.example`, and `vercel.json`.
- `backend/prisma/schema.prisma`, migration lock, foundation migration and integrity/security migration.
- `backend/src/application.ts`, `server.ts`, `access.ts`, `contracts.ts`, `errors.ts`, `identity.ts`, and `frontend/auth.ts`.
- `backend/scripts/bootstrap-founder.ts`, `provision.ts`, `openapi.ts`, and `test.ts`.
- `backend/tests/integration.test.ts` and `identity.test.ts`.
- `backend/openapi.json`, `INTEGRATION.md`, `DEPLOYMENT.md`, and this report.
- `frontend/.env.example` only; no frontend application source changed.
- Ignored local `backend/.env` and `frontend/.env.local` contain the supplied public project configuration. They are not committed. Server credentials are not present.

## Files modified

- `README.md`: standalone stack, setup, Phase 1 behavior and later-phase boundaries.
- `FRONTEND_ARCHITECTURE_PLAN.md`: superseded-platform notice; existing visual references preserved.

## APIs and contracts

`/api/v1` provides health/readiness/OpenAPI, active profile, founder staff administration, invitations, client CRUD without deletion, enquiry creation/read/update, wedding read/update, contact links, staff assignments, consultation requests/read/decisions. Exact paths, fields, roles, validation, response shapes and errors are in OpenAPI and the shared TypeScript contracts. Every mutation requires an idempotency key.

## Dependencies

Runtime: Prisma client, Supabase JS and SSR helpers, Express, Zod, CORS, Helmet, dotenv and node-postgres. Development: Prisma CLI, TypeScript, tsx, Supertest, embedded PostgreSQL and TypeScript definitions. Node.js 22.x is required. Tests use the built-in Node test runner. A tested `deepmerge-ts` override avoids the advisory affecting Prisma's older transitive dependency; the audit reports no vulnerabilities.

## Verification results

- Type checking of API, scripts and tests: passed.
- Prisma generation and TypeScript build: passed.
- Fresh PostgreSQL migration deployment: passed; second deployment had no pending migrations.
- Generated OpenAPI drift check: passed.
- **31 automated tests passed; 0 failed, skipped or cancelled.**
- Coverage includes invalid/expired identity handling, active-profile checks, deactivation, role escalation prevention, assignment isolation, explicit client invitation links, client field privacy, financial visibility, concurrent idempotent retries, duplicate prevention, independent enquiry/wedding states, transaction rollback, consultation transitions, concurrent overlaps across weddings, adjacency/rescheduling/cancellation, audit records, least-privilege access, RLS denial even after accidental browser-role grants, health/readiness, CORS, validation and structured errors.
- The Supabase adapter tests use the real SDK against a local HTTP fixture for token verification, identity recovery and invitation requests. They do not prove hosted email delivery or successful project login.
- `npm audit`: **0 vulnerabilities** at verification time.
- Read-only probe of supplied Supabase project: Auth settings reachable; public signup was enabled. No remote settings were changed.

## Remaining issues and integration requirements

- User will configure hosted Supabase/Vercel. Remote migrations, runtime role provisioning, private bucket creation, founder bootstrap, invitation email delivery and hosted login/recovery/refresh/logout remain unverified. Deployment is not claimed complete.
- Disable public Auth signup, configure exact redirect URLs and invitation templates/SMTP, provide runtime/admin environment variables, then follow `DEPLOYMENT.md`.
- Antigravity's frontend scaffold was added in remote commit `dcf20ae` during backend work. Its localStorage demo adapter and domain types differ from these contracts; they have been preserved. `INTEGRATION.md` lists the required API, pagination, field, enum, decimal-string and session integration changes. Frontend demo features are not evidence of implemented backend workflows.
- Retried invitations recover previously created Auth identities. Existing identities may require password recovery if an invitation email was lost. Supabase sign-out does not revoke already issued access tokens before expiry; profile deactivation is checked on each API request.
- No frontend browser QA or production load test was performed in this backend phase. No optional external agent-skill installation was needed.

## Git delivery

Work remains on `main`; no branch, pull request or force push is used. Only this phase's owned files are staged. The final delivery message records the actual commit hash and push result after pulling/integrating the latest `main`. Pause here for Phase 1 review before later-phase work.
