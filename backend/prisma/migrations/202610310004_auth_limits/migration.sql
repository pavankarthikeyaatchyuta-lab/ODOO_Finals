SET search_path = app, public;
CREATE TABLE app."RateLimitBucket" (
  key TEXT PRIMARY KEY,
  "windowStart" TIMESTAMPTZ(3) NOT NULL,
  count INTEGER NOT NULL CHECK (count > 0)
);
REVOKE ALL ON app."RateLimitBucket" FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON app."RateLimitBucket" TO rk_backend;
ALTER TABLE app."RateLimitBucket" ENABLE ROW LEVEL SECURITY;
CREATE POLICY backend_only ON app."RateLimitBucket" TO rk_backend USING (true) WITH CHECK (true);
DO $$ DECLARE browser_role text; BEGIN
  FOR browser_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated') LOOP
    EXECUTE format('REVOKE ALL ON app."RateLimitBucket" FROM %I', browser_role);
  END LOOP;
END $$;
