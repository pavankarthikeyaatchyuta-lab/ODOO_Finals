import 'dotenv/config';
import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const env = z.object({ DIRECT_URL: z.url(), BACKEND_DB_PASSWORD: z.string().min(24), SUPABASE_URL: z.url(), SUPABASE_SERVICE_ROLE_KEY: z.string().min(20), DOCUMENT_BUCKET: z.string().regex(/^[a-z0-9-]+$/).default('wedding-documents') }).parse(process.env);
const sql = new Client({ connectionString: env.DIRECT_URL });
await sql.connect();
try {
  const { rows } = await sql.query<{ statement: string }>("SELECT format('ALTER ROLE rk_backend LOGIN PASSWORD %L', $1::text) AS statement", [env.BACKEND_DB_PASSWORD]);
  await sql.query(rows[0]!.statement);
  const { rows: roles } = await sql.query('SELECT rolsuper, rolcreatedb, rolcreaterole, rolbypassrls FROM pg_roles WHERE rolname = $1', ['rk_backend']);
  if (roles.some(r => r.rolsuper || r.rolcreatedb || r.rolcreaterole || r.rolbypassrls)) throw new Error('rk_backend has excessive privileges; review before deployment');
} finally { await sql.end(); }
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: buckets, error: listError } = await admin.storage.listBuckets();
if (listError) throw new Error('Unable to inspect private document bucket');
const existing = buckets.find(b => b.id === env.DOCUMENT_BUCKET);
if (existing?.public) throw new Error('Document bucket is public; make it private before continuing');
if (!existing) {
  const { error } = await admin.storage.createBucket(env.DOCUMENT_BUCKET, { public: false, fileSizeLimit: 10485760, allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] });
  if (error) throw new Error('Unable to create private document bucket');
}
console.log('Runtime database role and private storage bucket configured. No browser storage policies were granted.');
