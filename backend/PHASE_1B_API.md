# Phase 1B exact API handoff

Antigravity should use this document with `openapi.json` and the exported request/response types in `src/contracts.ts`. All paths below are relative to `/api/v1`. There are no new frontend changes in this phase.

## Authentication and users

Authentication remains Supabase-managed. Passwords are transmitted over HTTPS for verification by Supabase; the application neither stores plaintext passwords nor creates another password/hash database. There is no public registration endpoint. Staff and clients enter through the existing invitation flow.

`POST /auth/login` (no bearer token or idempotency key):

```json
{ "email": "planner@example.com", "password": "<existing account password>" }
```

Successful response: **200**. Token strings below are placeholders, not credentials:

```json
{
  "accessToken": "<Supabase access token>",
  "refreshToken": "<Supabase refresh token>",
  "expiresAt": 1793446200,
  "tokenType": "bearer",
  "user": {
    "id": "f6c92667-5b4a-43be-a379-e10b04a43a2f",
    "email": "planner@example.com",
    "displayName": "Wedding Planner",
    "role": "PLANNER",
    "active": true,
    "timezone": "Asia/Kolkata"
  }
}
```

`POST /auth/refresh`: `{ "refreshToken": "<current refresh token>" }`. Returns the same session contract, using the provider's rotated tokens. Login and refresh require an active invited application profile and never create a user. Invalid credentials/session return 401; disabled/uninvited profiles return 403; provider throttling returns 429; provider outages return 503. Session responses use `Cache-Control: no-store`. Passwords/tokens never enter audit details or business idempotency records.

`POST /auth/logout`: bearer access token; body omitted or `{}`. Returns **200** `{ "success": true }`. Revokes the current Supabase session's refresh credentials. Previously issued access JWTs may remain usable until expiry; account deactivation is enforced on every protected request. Logout is permitted for a disabled account with a still-valid identity. The browser must clear its own stored session after successful logout.

Existing Vite/Supabase browser authentication can continue directly through the browser SDK. If the frontend uses these Express session endpoints, initialize the SDK with the returned `accessToken`/`refreshToken` via `supabase.auth.setSession` so the SDK can manage persistence and refresh. Do not build a second competing refresh loop.

Protected user APIs: `GET /me`; founder-only `GET /users`, `GET /users/:id`, `PATCH /users/:id`; and existing `POST /invitations`. Staff roles are `FOUNDER`, `PLANNER`, `COORDINATOR`, `FINANCE`; client role is `CLIENT`. A founder can change staff roles or set `active: false`, but cannot replace/deactivate a founder through ordinary user updates or turn a client account into staff.

Example founder update (bearer token and an idempotency key required):

```json
{ "role": "COORDINATOR", "active": true }
```

## Client CRUD

`POST /clients` (founder/planner), request:

```json
{ "name": "Aanya Sharma", "email": "aanya@example.com", "phone": "+91 9876543210" }
```

Successful response: **201**:

```json
{
  "id": "9a5dd9a8-5c0b-4fd5-a22a-8aabdc935025",
  "name": "Aanya Sharma",
  "email": "aanya@example.com",
  "phone": "+91 9876543210",
  "userId": null,
  "archivedAt": null,
  "createdAt": "2026-10-31T08:00:00.000Z",
  "updatedAt": "2026-10-31T08:00:00.000Z"
}
```

- `GET /clients?page=1&pageSize=25`: scoped staff collection; returns `{ data: ClientResponse[], page, pageSize, total }`.
- `GET /clients/:id`: scoped staff detail, **200** `ClientResponse`.
- `PATCH /clients/:id`: founder/assigned planner; nonempty subset of `name`, `email`, `phone`; **200** `ClientResponse`. Linked-account emails cannot be changed here. No `userId` or role mass assignment.
- `DELETE /clients/:id`: founder only; archives an unused contact. Live wedding links return **409** `CLIENT_IN_USE`. Successful archival returns **200** `ArchiveResponse` below. Emails remain unique after archival to prevent duplicate identities; restoration/merging is not a Phase 1B API.

## Wedding CRUD

`POST /weddings` (founder/planner), request:

```json
{
  "clientIds": ["9a5dd9a8-5c0b-4fd5-a22a-8aabdc935025"],
  "wedding": {
    "title": "Aanya & Arjun",
    "packageType": "FULL_SERVICE",
    "weddingDate": null,
    "guestCount": 400,
    "preferredTheme": "Royal Heritage"
  }
}
```

Successful response: **201**. Planner example:

```json
{
  "id": "74870e73-9746-4b93-b76e-c054b5860716",
  "title": "Aanya & Arjun",
  "weddingDate": null,
  "packageType": "FULL_SERVICE",
  "state": "ENQUIRY",
  "guestCount": 400,
  "preferredTheme": "Royal Heritage",
  "createdAt": "2026-10-31T08:00:00.000Z",
  "updatedAt": "2026-10-31T08:00:00.000Z",
  "internalNotes": null,
  "clientIds": ["9a5dd9a8-5c0b-4fd5-a22a-8aabdc935025"],
  "assignedUserIds": ["f6c92667-5b4a-43be-a379-e10b04a43a2f"]
}
```

This creates a provisional wedding and assigns a planner creator automatically; it does not create an enquiry or confirm a booking. Existing `POST /enquiries` still transactionally creates a separate enquiry and provisional wedding. Use its returned wedding ID rather than creating a second record.

- `GET /weddings?page=1&pageSize=25&state=ENQUIRY`: scoped collection, **200** paginated `WeddingResponse[]`.
- `GET /weddings/:id`: **200** `WeddingResponse`, projected according to the current role.
- `PATCH /weddings/:id`: founder/assigned planner, **200** `WeddingResponse`; nonempty subset of wedding detail fields and limited Phase 1 lifecycle state. Existing restrictions on budget visibility and updates remain.
- `DELETE /weddings/:id`: founder/assigned planner; archives only `ENQUIRY`, `PROPOSAL`, or `CANCELLED` records. Requested/confirmed consultations must be cancelled or completed first (**409** `ACTIVE_CONSULTATIONS`). Other lifecycle states return **409** `WEDDING_IN_USE`.

Successful DELETE returns **200**:

```json
{ "id": "74870e73-9746-4b93-b76e-c054b5860716", "archivedAt": "2026-10-31T09:00:00.000Z" }
```

Archival preserves wedding/client records, central wedding UUID, enquiries, consultations, relationships and audit history. Archived wedding details and related enquiry/consultation APIs return 404 and are excluded from lists, including client APIs. Repeating an archival request with the same idempotency key returns the original result after access checks. A new key against an already archived record returns 404.

Client-facing wedding fields remain exactly `id`, `title`, `weddingDate`, `packageType`, `state`, `guestCount`, `preferredTheme`, `createdAt`, `updatedAt`. No internal notes, assignments, private financial/vendor/incident fields are exposed. Client accounts cannot create/update/archive weddings or contacts.

## Validation and errors

All request objects reject unexpected fields. Business mutations require a bearer token and `Idempotency-Key` (8–128 allowed ASCII characters). Reusing a key for different input/path returns 409. Authentication operations are excluded from this cache.

| Field | Rule |
| --- | --- |
| IDs | Valid UUIDs; referenced contacts must exist and be available to the caller |
| Name/title/display name | Trimmed, 1–200 characters |
| Email | Valid email, at most 254 characters; normalized to lowercase; contact/profile uniqueness enforced in PostgreSQL |
| Phone | Optional/null; otherwise trimmed, 3–40 characters |
| Login password | Nonempty, at most 1024 characters; never trimmed; password policy/verification delegated to Supabase |
| Refresh token | Nonempty, at most 4096 characters |
| Package | `FULL_SERVICE` or `PARTIAL_DAY_OF`; existing `PackageType` enum is authoritative |
| Wedding date | Real `YYYY-MM-DD` date or null |
| Guests | Optional/null; otherwise integer from 1 to 100000 |
| Budget | Optional/null; nonnegative decimal string, at most 14 integer digits and 2 decimal places |
| Notes/theme | Notes at most 5000 characters; theme at most 200 |
| Pagination | Page 1–100000; pageSize 1–100; defaults 1/25 |
| Body | JSON at most 64kb |

Example **400** response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "fields": [{ "path": "email", "message": "Invalid email address" }],
    "requestId": "1576ea13-113a-4664-aa89-0cbb99798281"
  }
}
```

Field messages come from Zod and may vary by validation case; branch on `code` and field `path`, not message text. The request ID also appears in `X-Request-Id`. Other statuses include 401 authentication failure, 403 permission/account restriction, 404 inaccessible record, 409 business/uniqueness conflict, 413 oversized input, 429 provider throttling, 500 unexpected failure, and 503 dependency unavailability. Database error text, credentials and request passwords are not returned.

## Model and migration decisions

Reused `UserProfile`, `Role`, `Client`, `Wedding` and `PackageType`; no duplicate User, Role or WeddingPackage tables. Added nullable archival timestamps and a minimal `WeddingFunction` child model with three function types, optional paired timestamps and a foreign key to the stable wedding UUID. No function planning/automation endpoints are implemented. Its table has the same private-schema, backend-only RLS policy as other business records.

Apply migration `202610310003_foundation_crud` with `npm run db:migrate` before running this API version. Existing migrations are unchanged. Hosted migrations and live Supabase/Vercel checks remain the user's configuration work; local automated tests use isolated PostgreSQL and an HTTP Auth fixture.
