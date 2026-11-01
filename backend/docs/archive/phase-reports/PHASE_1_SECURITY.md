# Phase 1 foundation verification and security follow-up

The existing foundation is reused: Express/TypeScript configuration, environment validation, Prisma/PostgreSQL, modular routes/controllers/services, safe errors, validation, Supabase password verification, active accounts, resource-level permissions, client/wedding CRUD and founder user administration.

This phase adds database-backed fixed-window rate limiting to login and refresh. Login allows 10 attempts per normalized email per minute; both session endpoints allow 60 attempts per network address per minute. Only hashed bucket identifiers are stored, never passwords or tokens. The database coordinates limits across Vercel instances. The application uses the trusted socket address; deploy an appropriately configured edge limit as well if the proxy does not expose individual client addresses. A 429 includes `Retry-After: 60`.

Migration `202610310004_auth_limits` creates only the private rate-limit table, its positive-count constraint and a backend-only RLS policy. It does not reset, drop or seed the existing database. No production migration is executed by this phase.

The independently staged Phase 1 snapshot passed TypeScript checking, migration replay, OpenAPI drift verification and **49 tests (0 failures)**. New tests exercise repeated login attempts and database failures. Health remains available without a database; readiness and protected operations report safe 503 errors. Existing auth, unauthorized access, client/wedding creation, validation and resource-ownership tests remain in the suite.

All existing endpoint contracts remain available in `openapi.json`, `PHASE_1B_API.md` and shared TypeScript contracts. Supabase manages password hashing; no plaintext password is stored. Hosted setup and live-provider verification remain the user's configuration work.
