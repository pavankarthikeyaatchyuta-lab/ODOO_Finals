import { it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { Client } from 'pg';

it('upgrades existing valid rows without changes and atomically rejects inconsistent legacy document links', async () => {
  assert.equal(process.env.ROYAL_KNOT_ISOLATED_TEST, 'true');
  const adminUrl = new URL(process.env.TEST_ADMIN_URL!);
  assert.equal(adminUrl.hostname, '127.0.0.1');
  assert.equal(adminUrl.pathname, '/royal_knot_test');
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try { await admin.query('CREATE DATABASE royal_knot_upgrade_test'); } finally { await admin.end(); }
  adminUrl.pathname = '/royal_knot_upgrade_test';
  const sql = new Client({ connectionString: adminUrl.toString() });
  await sql.connect();
  try {
    // Stand-in for Prisma's own bookkeeping table; business DDL below is the unchanged released SQL.
    await sql.query('CREATE SCHEMA app; CREATE TABLE app._prisma_migrations (id text PRIMARY KEY)');
    const root = new URL('../prisma/migrations/', import.meta.url);
    const migrations = (await readdir(root)).filter(name => /^\d{12}_/.test(name)).sort();
    assert.equal(migrations.length, 10);
    for (const name of migrations.slice(0, -1)) await sql.query(await readFile(new URL(`${name}/migration.sql`, root), 'utf8'));
    const [actor, weddingA, weddingB, doc, agreement, payment] = Array.from({ length: 6 }, () => randomUUID());
    await sql.query('INSERT INTO app."UserProfile" (id,email,"displayName",role,"updatedAt") VALUES ($1,$2,$3,$4,now())', [actor, 'migration-fixture@fictional.invalid', 'FICTIONAL upgrade fixture', 'FOUNDER']);
    for (const id of [weddingA, weddingB]) await sql.query('INSERT INTO app."Wedding" (id,title,"packageType","updatedAt") VALUES ($1,$2,$3,now())', [id, 'FICTIONAL existing wedding', 'FULL_SERVICE']);
    await sql.query('INSERT INTO app."Document" (id,"weddingId",kind,"storagePath","fileName","contentType",size,"uploadedBy") VALUES ($1,$2,$3,$4,$5,$6,1,$7)', [doc, weddingA, 'AGREEMENT', `fixture/${doc}.pdf`, 'fictional.pdf', 'application/pdf', actor]);
    await sql.query('INSERT INTO app."Agreement" (id,"weddingId",title,terms,"documentId","updatedAt") VALUES ($1,$2,$3,$4,$5,now())', [agreement, weddingB, 'FICTIONAL invalid legacy link', 'Fixture terms', doc]);
    await sql.query('INSERT INTO app."BookingPayment" (id,"weddingId",amount,currency,reference,"claimedBy") VALUES ($1,$2,1,$3,$4,$5)', [payment, weddingA, 'INR', 'FICTIONAL-UPGRADE-PAYMENT', actor]);
    const migration = await readFile(new URL(`${migrations.at(-1)!}/migration.sql`, root), 'utf8');
    await assert.rejects(sql.query(migration), /foreign key constraint/i);
    await sql.query('ROLLBACK');
    assert.equal((await sql.query("SELECT count(*)::int AS n FROM pg_constraint WHERE conname='Agreement_documentId_fkey'")).rows[0].n, 1);
    assert.equal((await sql.query("SELECT to_regclass('app.\"Document_id_weddingId_key\"') AS relation")).rows[0].relation, null);
    // Simulates an authorized correction before release; migration itself does not alter business data.
    await sql.query('UPDATE app."Agreement" SET "weddingId"=$1 WHERE id=$2', [weddingA, agreement]);
    const snapshot = async () => {
      const rows = [];
      for (const table of ['UserProfile', 'Wedding', 'Document', 'Agreement', 'BookingPayment']) rows.push((await sql.query(`SELECT row_to_json(t) AS data FROM app."${table}" t ORDER BY id`)).rows);
      return rows;
    };
    const before = await snapshot();
    await sql.query(migration);
    assert.deepEqual(await snapshot(), before);
    assert.equal((await sql.query("SELECT count(*)::int AS n FROM pg_constraint WHERE conname='Agreement_documentId_weddingId_fkey' AND convalidated")).rows[0].n, 1);
  } finally { await sql.end(); }
});
