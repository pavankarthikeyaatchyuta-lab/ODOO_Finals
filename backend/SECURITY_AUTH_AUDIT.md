# Backend security, schema and authentication audit

Review date: **31 October 2026**. Baseline: `54c706e`, existing `main`. Scope: backend authentication, session validation, authorization, schema/migration integrity, privacy, errors, secrets, and duplicate/concurrent interactions. Tests use disposable loopback PostgreSQL and an HTTP fixture for the actual Supabase SDK adapter. They do not contact the hosted Supabase project.

## Findings fixed

| Finding | Resulting behavior | Evidence |
| --- | --- | --- |
| Unexpected identity exceptions could become generic 500 responses; invalid identity IDs could reach UUID database queries. | Login, refresh, logout and protected token verification map unexpected provider failures to safe 503 `AUTH_UNAVAILABLE`. Verified IDs must be UUIDs. | Provider failure and malformed-ID tests across every auth path. |
| Supabase token-verification throttling was treated as an invalid identity. | Provider 429 remains 429 `AUTH_RATE_LIMITED` with Retry-After, rather than forcing a false invalid-token result. | Actual SDK adapter HTTP 429 test. |
| Issued provider sessions lacked explicit shape/expiry checks before profile lookup and audit. | UUID identity, nonempty whitespace-free tokens, bearer type and positive expiry are checked first. Expired sessions are denied; malformed sessions fail safely. Rejected sessions trigger best-effort sign-out. | Disabled, uninvited, expired and malformed provider session tests, including revocation attempts and no implicit profile creation. |
| A queued business request could continue with the profile/role read at initial authentication. | The transaction locks and rereads its active profile and permissions before resource guards or cached replay. Administrative deactivation/demotion cannot be bypassed by a request waiting behind the profile change. | Deterministic real-PostgreSQL concurrency test: pending deactivation and PLANNER → FINANCE both deny queued client creation, with no created record. |
| Auth attempt budgets reset at a wall-clock minute boundary. | A database-backed 60-second window starts at its first attempt. Calendar boundaries do not grant a second early budget. | Twenty concurrent attempts against a five-attempt fixture allow exactly five; later window expiry restores the budget. |
| Remote HTTP auth/frontend configuration was accepted. | Remote auth and frontend origins require HTTPS; only loopback permits HTTP development. Embedded credentials and non-origin Supabase URLs are rejected. | Configuration validation tests. |

Passwords remain Supabase-managed. No local password storage, password hashing implementation or second session/token database was added. Existing password strings are not trimmed or subjected to signup rules during login.

## Login and duplicate-interaction checks

- Missing fields, invalid email, empty/oversized/non-string password, injected role and extra query parameters are rejected before calling identity. Email normalization is retained; password bytes/spacing are preserved.
- Wrong credentials and provider-rejected refreshes return 401 without token fields. Disabled/uninvited application profiles return 403 and do not become new users.
- Parallel logins for two users and repeated login for one user remain independent. Every returned access token resolves to the correct application profile. No passwords/access/refresh tokens appear in business idempotency records, audit details or limiter rows.
- The **actual Supabase SDK adapter**, against a local HTTP fixture, logs in two different users concurrently and preserves the administrative client's server-key authorization for a subsequent invite lookup. This verifies SDK client separation, without claiming a hosted login succeeded.
- A JWT with a real-looking subject and future expiry is not trusted based on decoding; the verification provider still denies it.
- A one-use refresh fixture yields one successful refresh and one rejection under two concurrent requests. This proves the backend obeys a provider rejection; it does **not** claim Supabase disables its documented refresh-reuse allowance.
- Two simultaneous business creations with the same key create one record. Two staff invitations for one normalized email with different operation keys reuse one explicitly authorized identity/profile and make one provider invitation call.
- Existing concurrent consultation conflicts, task generation, quote selection, schedule publication/acknowledgement, payment verification, ownership, role-escalation and rollback tests remain included.

The first expanded run had one failing test because a transaction-local PostgreSQL statistics snapshot hid the request's wait state from the test's polling. Polling through a separate autocommit connection fixes the fixture and observes the real lock boundary. No production code was weakened to make the test pass.

A separate Windows teardown issue was reproduced after passing tests: the embedded package's forced process-tree shutdown could leave a PostgreSQL I/O worker holding a pipe open. The Windows-only test runner now uses the bundled `pg_ctl` for orderly, bounded shutdown of the verified generated test directory. This is isolated-test infrastructure, not a production database command or a new dependency.

## Schema and security controls checked

All 37 Prisma models remain covered by schema validation and the complete migration suite. No schema changes or new migrations are required for these auth fixes. Existing ten migrations, fresh/repeated deployment, schema drift, valid-data upgrade and failure rollback, validated foreign keys/indexes, business-table RLS/browser grants, and restricted runtime permissions are verified by the isolated runner.

All business mutation validation remains strict. Database constraints, transactional wedding locks, idempotency and explicit resource checks remain in force. Protected response caching remains disabled. Clients do not receive private incident details, internal notes, vendor negotiations or internal costs/profitability. Private document metadata, file verification and download gates remain tested. Safe errors carry a request ID without SQL, credentials, stack traces or provider exception contents.

Runtime role has no schema DDL, superuser or RLS bypass. Browser roles have no business-table write access. Administrative keys and database URLs remain server environment values; public contracts contain no server secrets. A tracked-file credential-signature scan accompanies the review.

## Integration and operational limits

- Frontend login/business services still use demo profiles/localStorage and require the documented Antigravity integration. Backend tests do not make that demo UI a live authenticated application.
- Hosted invitation/recovery delivery, password strength/security settings, public-signup disablement, SMTP, pooler/TLS, Storage policies and Vercel health checks still require the user's project configuration and hosted acceptance tests.
- The backend revokes the current Supabase refresh session on logout. Access JWTs may remain valid until expiry; this is not represented as immediate JWT invalidation. Deactivation is enforced from the application profile at the next transaction authorization boundary.
- Refresh-token reuse allowance and session policies belong to Supabase. The client should use SDK refresh coordination rather than concurrent custom refresh loops.
- The peer limiter intentionally does not trust arbitrary forwarded IP headers. Confirm trusted proxy behavior and edge rate limits on Vercel; a proxy can aggregate socket peers. No internet-scale load, penetration-test certification or provider-side settings verification is claimed.
- Issued signed document/capability URLs have their documented expiration rules. Session logout does not retroactively erase already issued external capabilities.

The session-policy and logout limits above follow the official [Supabase session documentation](https://supabase.com/docs/guides/auth/sessions) and [sign-out documentation](https://supabase.com/docs/reference/javascript/auth-signout).

## Files and delivery

| Final verification | Result |
| --- | --- |
| Full isolated suite | **102 passed; 0 failed; 0 skipped**, runner exit 0 including orderly Windows PostgreSQL teardown |
| Prisma schema: all 37 business models | Valid |
| Ten migrations: fresh deploy, repeat deploy, schema drift | Pass |
| Existing-data upgrade and atomic failure rollback | Pass |
| Backend production build | Pass |
| TypeScript, including test/runner code | Pass |
| OpenAPI drift check | Pass; stricter token schemas and protected 429 responses published |
| Backend dependency audit, including development packages | 0 known vulnerabilities reported |
| Tracked credential-signature scan | No matching credential/private-key signatures |
| Frontend, existing migrations and environment files | Unchanged |
| Hosted Supabase login/recovery/email and Vercel verification | Pending; no hosted database or identity changes performed |

Changes are limited to `src/identity.ts`, `middleware/authentication.ts`, `controllers/auth.ts`, `services/auth.ts`, `services/rate-limit.ts`, `http/routes.ts`, `config.ts`, `contracts.ts`, the generated `openapi.json`, auth/SDK regression tests and the isolated runner, plus authentication/deployment documentation. No frontend files, existing migrations, passwords or credentials are modified. No dependencies are added.

The exact commit/push status is recorded in the delivery message after verification. Work remains on `main`, using Busireddy Mohan Narayana Reddy <busireddy.mohannarayanareddy@gmail.com>, with a normal push and no history rewrite.
