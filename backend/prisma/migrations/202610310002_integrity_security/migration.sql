CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
SET search_path = app, public, extensions;

ALTER TABLE app."Wedding" ADD CONSTRAINT wedding_valid_numbers
  CHECK (("guestCount" IS NULL OR "guestCount" > 0) AND ("budgetMax" IS NULL OR "budgetMax" >= 0));
ALTER TABLE app."Consultation" ADD CONSTRAINT consultation_valid_times CHECK (
  ("startAt" IS NULL AND "endAt" IS NULL AND "plannerId" IS NULL AND state IN ('REQUESTED', 'CANCELLED'))
  OR ("startAt" IS NOT NULL AND "endAt" IS NOT NULL AND "plannerId" IS NOT NULL AND "endAt" > "startAt" AND state <> 'REQUESTED')
);
-- Half-open intervals allow back-to-back appointments; the index arbitrates concurrent writes.
ALTER TABLE app."Consultation" ADD CONSTRAINT consultation_no_overlap
  EXCLUDE USING gist ("plannerId" WITH =, tstzrange("startAt", "endAt", '[)') WITH &&)
  WHERE (state = 'CONFIRMED');
ALTER TABLE app."Client" ADD CONSTRAINT client_normalized_email CHECK (email = lower(email));
ALTER TABLE app."UserProfile" ADD CONSTRAINT profile_normalized_email CHECK (email = lower(email));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rk_backend') THEN
    CREATE ROLE rk_backend NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;
REVOKE ALL ON SCHEMA app FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO rk_backend;
REVOKE ALL ON ALL TABLES IN SCHEMA app FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA app TO rk_backend;
REVOKE ALL ON app."_prisma_migrations" FROM rk_backend;
REVOKE UPDATE ON app."AuditLog", app."IdempotencyRecord" FROM rk_backend;
GRANT DELETE ON app."WeddingAssignment" TO rk_backend;

DO $$ DECLARE item record; browser_role text; BEGIN
  FOR browser_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') LOOP
    EXECUTE format('REVOKE ALL ON SCHEMA app FROM %I', browser_role);
    EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA app FROM %I', browser_role);
  END LOOP;
  FOR item IN SELECT tablename FROM pg_tables WHERE schemaname = 'app' AND tablename <> '_prisma_migrations' LOOP
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', item.tablename);
    EXECUTE format('CREATE POLICY backend_only ON app.%I TO rk_backend USING (true) WITH CHECK (true)', item.tablename);
  END LOOP;
END $$;

ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES FROM PUBLIC;
