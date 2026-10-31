import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient, type Role } from '@prisma/client';
import request from 'supertest';
import { Client as PgClient } from 'pg';
import { createApp } from '../src/application.js';
import { ApiError } from '../src/errors.js';

assert.equal(process.env.ROYAL_KNOT_ISOLATED_TEST, 'true', 'Use npm test; never run fixtures against a project database');
const db = new PrismaClient();
const owner = new PrismaClient({ datasources: { db: { url: process.env.TEST_ADMIN_URL! } } });
const ids = Object.fromEntries(['founder', 'planner', 'other', 'client', 'coordinator', 'finance', 'inactive'].map(name => [name, randomUUID()])) as Record<string, string>;
let invitations = 0;
const app = createApp(db, {
  async verify(token) { if (token === 'auth-down') throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable'); return ids[token] ?? null; },
  async invite() { invitations++; return randomUUID(); },
}, { allowedOrigins: ['https://frontend.test'] });
const key = () => randomUUID();
function api(method: 'get' | 'post' | 'patch' | 'delete', path: string, actor = 'founder', body?: object, idempotency = key()) {
  const req = request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${actor}`);
  if (method !== 'get') req.set('Idempotency-Key', idempotency);
  return body === undefined ? req : req.send(body);
}
let weddingId: string, enquiryId: string, clientId: string, hiddenWeddingId: string;
const future = (minutes: number) => new Date(Date.now() + minutes * 60000).toISOString();
function createRequest(wedding = weddingId, actor = 'client') {
  return api('post', '/consultations', actor, { weddingId: wedding, preferredAt: future(500), message: 'Please discuss the venue' });
}
function confirm(id: string, startAt = future(600), endAt = future(660), actor = 'planner') {
  return api('patch', `/consultations/${id}`, actor, { state: 'CONFIRMED', startAt, endAt, plannerId: ids.planner, internalNotes: 'Private staff discussion' });
}

before(async () => {
  for (const [name, id] of Object.entries(ids)) {
    const role: Role = name === 'founder' ? 'FOUNDER' : name === 'client' ? 'CLIENT' : name === 'coordinator' ? 'COORDINATOR' : name === 'finance' ? 'FINANCE' : 'PLANNER';
    await owner.userProfile.create({ data: { id, email: `${name}@test.invalid`, displayName: name, role, active: name !== 'inactive' } });
  }
  const client = await api('post', '/clients', 'founder', { name: 'Wedding Client', email: 'client@test.invalid' }).expect(201);
  clientId = client.body.id;
  await owner.client.update({ where: { id: clientId }, data: { userId: ids.client } });
  const enquiry = await api('post', '/enquiries', 'founder', { clientIds: [clientId], wedding: { title: 'Royal Wedding', packageType: 'FULL_SERVICE', budgetMax: '123456.78', internalNotes: 'Confidential negotiation' }, internalNotes: 'Private enquiry', source: 'PHONE' }).expect(201);
  weddingId = enquiry.body.wedding.id;
  enquiryId = enquiry.body.enquiry.id;
  for (const actor of ['planner', 'coordinator', 'finance']) await api('post', `/weddings/${weddingId}/assignments`, 'founder', { userId: ids[actor] }).expect(201);
  const otherClient = await api('post', '/clients', 'founder', { name: 'Another Client', email: 'another@test.invalid' }).expect(201);
  const other = await api('post', '/enquiries', 'founder', { clientIds: [otherClient.body.id], wedding: { title: 'Other Wedding', packageType: 'PARTIAL_DAY_OF' } }).expect(201);
  hiddenWeddingId = other.body.wedding.id;
});
after(async () => { await db.$disconnect(); await owner.$disconnect(); });

describe('authentication, authorization and privacy', () => {
  it('requires a verified token, rejects invalid and expired tokens', async () => {
    await request(app).get('/api/v1/me').expect(401);
    for (const token of ['invalid', 'expired']) await api('get', '/me', token).expect(401);
    await api('get', '/me', 'inactive').expect(403);
    await api('get', '/me', 'auth-down').expect(503);
  });
  it('reads the active profile every request and immediately enforces deactivation', async () => {
    await api('get', '/me', 'other').expect(200);
    await api('patch', `/users/${ids.other}`, 'founder', { active: false }).expect(200);
    await api('get', '/me', 'other').expect(403);
    await api('patch', `/users/${ids.other}`, 'founder', { active: true }).expect(200);
  });
  it('prevents role escalation, mass assignment and founder replacement', async () => {
    await api('patch', `/users/${ids.planner}`, 'planner', { role: 'FINANCE' }).expect(403);
    await api('patch', `/users/${ids.founder}`, 'founder', { active: false }).expect(403);
    await api('patch', `/users/${ids.client}`, 'founder', { role: 'PLANNER' }).expect(403);
    await api('patch', `/weddings/${weddingId}`, 'planner', { state: 'BOOKING_CONFIRMED' }).expect(400);
    await api('patch', `/clients/${clientId}`, 'founder', { userId: ids.planner }).expect(400);
  });
  it('isolates assignments on detail and collection endpoints', async () => {
    for (const actor of ['planner', 'coordinator', 'finance', 'client']) {
      await api('get', `/weddings/${hiddenWeddingId}`, actor).expect(404);
      const rows = await api('get', '/weddings', actor).expect(200);
      assert.deepEqual(rows.body.data.map((w: { id: string }) => w.id), [weddingId]);
    }
    await api('patch', `/weddings/${hiddenWeddingId}`, 'planner', { title: 'Takeover' }).expect(404);
    await api('post', `/weddings/${weddingId}/assignments`, 'planner', { userId: ids.other }).expect(403);
  });
  it('returns only explicit client-visible fields on detail and list responses', async () => {
    const wedding = await api('get', `/weddings/${weddingId}`, 'client').expect(200);
    assert.deepEqual(Object.keys(wedding.body).sort(), ['id', 'title', 'weddingDate', 'packageType', 'state', 'guestCount', 'preferredTheme', 'createdAt', 'updatedAt'].sort());
    const enquiries = await api('get', '/enquiries', 'client').expect(200);
    const enquiry = await api('get', `/enquiries/${enquiryId}`, 'client').expect(200);
    for (const row of [enquiry.body, ...enquiries.body.data]) assert.deepEqual(Object.keys(row).sort(), ['id', 'weddingId', 'stage', 'createdAt', 'updatedAt'].sort());
    await api('get', '/clients', 'client').expect(403);
    await api('get', '/users', 'client').expect(403);
  });
  it('limits internal financial visibility and makes coordinator/finance operational access read-only', async () => {
    const planner = await api('get', `/weddings/${weddingId}`, 'planner').expect(200);
    assert.equal(planner.body.budgetMax, undefined);
    const finance = await api('get', `/weddings/${weddingId}`, 'finance').expect(200);
    assert.equal(finance.body.budgetMax, '123456.78');
    for (const actor of ['coordinator', 'finance', 'client']) await api('patch', `/weddings/${weddingId}`, actor, { title: 'No' }).expect(403);
    await api('patch', `/weddings/${weddingId}`, 'planner', { budgetMax: '42.00' }).expect(403);
  });
  it('requires explicit client invitation links, never grants access by matching email', async () => {
    await api('post', '/invitations', 'planner', { email: 'newstaff@test.invalid', displayName: 'New Staff', role: 'FINANCE' }).expect(403);
    await api('post', '/invitations', 'planner', { email: 'wrong@test.invalid', displayName: 'Wrong', role: 'CLIENT', clientId, weddingId }).expect(400);
    await api('post', '/invitations', 'planner', { email: 'client@test.invalid', displayName: 'Wrong wedding', role: 'CLIENT', clientId, weddingId: hiddenWeddingId }).expect(404);
    const newClient = await api('post', '/clients', 'founder', { name: 'Invited client', email: 'invited@test.invalid' }).expect(201);
    await api('post', `/weddings/${weddingId}/clients`, 'founder', { clientId: newClient.body.id }).expect(201);
    const retryKey = key();
    const body = { email: 'invited@test.invalid', displayName: 'Invited client', role: 'CLIENT', clientId: newClient.body.id, weddingId };
    const first = await api('post', '/invitations', 'planner', body, retryKey).expect(201);
    const replay = await api('post', '/invitations', 'planner', body, retryKey).expect(201);
    assert.deepEqual(first.body, replay.body);
    assert.equal(invitations, 1);
    assert.equal((await owner.client.findUniqueOrThrow({ where: { id: newClient.body.id } })).userId, first.body.id);
  });
  it('rechecks wedding access before returning a cached write response', async () => {
    const retryKey = key(), body = { title: 'Updated title' };
    await api('patch', `/weddings/${weddingId}`, 'planner', body, retryKey).expect(200);
    await owner.weddingAssignment.delete({ where: { weddingId_userId: { weddingId, userId: ids.planner! } } });
    await api('patch', `/weddings/${weddingId}`, 'planner', body, retryKey).expect(404);
    await owner.weddingAssignment.create({ data: { weddingId, userId: ids.planner! } });
  });
});

describe('enquiries, lifecycle and transactional idempotency', () => {
  it('keeps enquiry and wedding identities distinct and booking provisional', async () => {
    const enquiry = await owner.enquiry.findUniqueOrThrow({ where: { id: enquiryId } });
    assert.notEqual(enquiry.id, enquiry.weddingId);
    assert.equal(enquiry.stage, 'NEW');
    assert.equal((await owner.wedding.findUniqueOrThrow({ where: { id: weddingId } })).state, 'ENQUIRY');
    assert.equal((await owner.wedding.findUniqueOrThrow({ where: { id: weddingId } })).weddingDate, null);
  });
  it('updates enquiry stages without confirming or replacing the wedding', async () => {
    await api('patch', `/enquiries/${enquiryId}`, 'planner', { stage: 'PROPOSAL_SENT' }).expect(200);
    assert.equal((await owner.wedding.findUniqueOrThrow({ where: { id: weddingId } })).state, 'ENQUIRY');
    const result = await api('patch', `/weddings/${weddingId}`, 'planner', { state: 'PROPOSAL' }).expect(200);
    assert.equal(result.body.id, weddingId);
    await api('patch', `/weddings/${weddingId}`, 'planner', { state: 'AGREEMENT' }).expect(400);
  });
  it('prevents duplicate contacts and normalizes email', async () => {
    const body = { name: 'Unique', email: 'UNIQUE@Test.Invalid' };
    const first = await api('post', '/clients', 'planner', body).expect(201);
    assert.equal(first.body.email, 'unique@test.invalid');
    await api('post', '/clients', 'planner', { ...body, email: 'unique@test.invalid' }).expect(409);
  });
  it('serializes concurrent retries, rejects changed payloads and creates exactly one wedding', async () => {
    const before = await owner.wedding.count();
    const retryKey = key();
    const body = { clientIds: [clientId], wedding: { title: 'Idempotent Wedding', packageType: 'FULL_SERVICE' } };
    const results = await Promise.all([api('post', '/enquiries', 'founder', body, retryKey), api('post', '/enquiries', 'founder', body, retryKey)]);
    assert.deepEqual(results.map(r => r.status), [201, 201]);
    assert.deepEqual(results[0]!.body, results[1]!.body);
    assert.equal(await owner.wedding.count(), before + 1);
    await api('post', '/enquiries', 'founder', { ...body, wedding: { ...body.wedding, title: 'Different' } }, retryKey).expect(409);
  });
  it('rolls back wedding, links, enquiry, audit and idempotency when an audit write fails', async () => {
    const admin = new PgClient({ connectionString: process.env.TEST_ADMIN_URL! });
    await admin.connect();
    const before = await owner.wedding.count();
    const retryKey = key();
    try {
      await admin.query(`CREATE FUNCTION app.test_reject_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected failure'; END $$;
        CREATE TRIGGER test_reject_audit BEFORE INSERT ON app."AuditLog" FOR EACH ROW EXECUTE FUNCTION app.test_reject_audit()`);
      await api('post', '/enquiries', 'founder', { clientIds: [clientId], wedding: { title: 'Rollback', packageType: 'FULL_SERVICE' } }, retryKey).expect(500);
      assert.equal(await owner.wedding.count(), before);
      assert.equal(await owner.idempotencyRecord.count({ where: { key: retryKey } }), 0);
    } finally { await admin.query('DROP TRIGGER IF EXISTS test_reject_audit ON app."AuditLog"; DROP FUNCTION IF EXISTS app.test_reject_audit()'); await admin.end(); }
  });
  it('supports explicit additional contacts and one client across multiple weddings', async () => {
    assert.ok(await owner.weddingClient.count({ where: { weddingId } }) > 1);
    assert.ok(await owner.weddingClient.count({ where: { clientId } }) > 1);
  });
  it('validates UUIDs, real dates, package, money, pagination and unknown fields', async () => {
    await api('get', '/weddings/not-a-uuid').expect(400);
    await api('get', '/weddings?pageSize=101').expect(400);
    for (const wedding of [{ weddingDate: '2026-02-30' }, { packageType: 'OTHER' }, { budgetMax: '-10' }, { guestCount: -1 }]) {
      await api('post', '/enquiries', 'founder', { clientIds: [clientId], wedding: { title: 'Invalid', packageType: 'FULL_SERVICE', ...wedding } }).expect(400);
    }
    await request(app).post('/api/v1/clients').set('Authorization', 'Bearer founder').send({ name: 'Missing key', email: 'missing@test.invalid' }).expect(400);
  });
});

describe('consultation workflow and database scheduling guard', () => {
  it('allows client requests, never client confirmation, and hides private consultation fields', async () => {
    const created = await createRequest();
    assert.equal(created.body.state, 'REQUESTED');
    assert.equal(created.body.startAt, null);
    assert.equal(created.body.internalNotes, undefined);
    assert.equal(created.body.requestedBy, undefined);
    await confirm(created.body.id, future(100), future(120), 'client').expect(403);
    const confirmed = await confirm(created.body.id, future(100), future(120)).expect(200);
    assert.equal(confirmed.body.state, 'CONFIRMED');
    const detail = await api('get', `/consultations/${created.body.id}`, 'client').expect(200);
    const list = await api('get', `/consultations?weddingId=${weddingId}`, 'client').expect(200);
    for (const row of [detail.body, ...list.body.data]) {
      assert.equal(row.internalNotes, undefined); assert.equal(row.plannerId, undefined); assert.equal(row.requestedBy, undefined);
    }
    await api('patch', `/consultations/${created.body.id}`, 'planner', { state: 'CANCELLED' }).expect(200);
  });
  it('rejects invalid intervals, past times, unassigned planners and cross-wedding requests', async () => {
    const created = await createRequest();
    await confirm(created.body.id, future(300), future(299)).expect(400);
    await confirm(created.body.id, future(-30), future(-10)).expect(400);
    await api('patch', `/consultations/${created.body.id}`, 'planner', { state: 'CONFIRMED', startAt: future(300), endAt: future(360), plannerId: ids.other }).expect(400);
    await createRequest(hiddenWeddingId, 'client').expect(404);
    await api('get', `/consultations/${created.body.id}`, 'other').expect(404);
    await api('patch', `/consultations/${created.body.id}`, 'planner', { state: 'COMPLETED' }).expect(409);
  });
  it('allows only one of two concurrent overlapping confirmations across weddings', async () => {
    await api('post', `/weddings/${hiddenWeddingId}/assignments`, 'founder', { userId: ids.planner }).expect(201);
    const first = await createRequest();
    const second = await createRequest(hiddenWeddingId, 'founder');
    const startAt = future(1000), endAt = future(1060);
    const results = await Promise.all([confirm(first.body.id, startAt, endAt), confirm(second.body.id, startAt, endAt)]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    assert.equal(results.find(r => r.status === 409)?.body.error.code, 'SCHEDULING_CONFLICT');
    assert.equal(await owner.consultation.count({ where: { id: { in: [first.body.id, second.body.id] }, state: 'CONFIRMED' } }), 1);
  });
  it('permits adjacent bookings, rolls back conflicting reschedules and releases cancelled slots', async () => {
    const first = await createRequest(), second = await createRequest();
    const start = future(1200), middle = future(1260), end = future(1320);
    await confirm(first.body.id, start, middle).expect(200);
    await confirm(second.body.id, middle, end).expect(200);
    await confirm(second.body.id, future(1230), future(1290)).expect(409);
    assert.equal((await owner.consultation.findUniqueOrThrow({ where: { id: second.body.id } })).startAt?.toISOString(), middle);
    await api('patch', `/consultations/${first.body.id}`, 'planner', { state: 'CANCELLED' }).expect(200);
    await confirm(second.body.id, start, middle).expect(200);
    await api('patch', `/consultations/${second.body.id}`, 'planner', { state: 'COMPLETED' }).expect(200);
    await confirm(second.body.id, future(1400), future(1460)).expect(409);
  });
  it('prevents unassigning a planner while confirmed consultations remain', async () => {
    const appointment = await createRequest().expect(201);
    await confirm(appointment.body.id, future(2000), future(2060)).expect(200);
    await api('delete', `/weddings/${weddingId}/assignments/${ids.planner}`, 'founder').expect(409);
  });
  it('records decisions with actor, timestamps and previous schedule', async () => {
    const row = await owner.auditLog.findFirst({ where: { action: 'CONSULTATION_DECIDED', weddingId }, orderBy: { createdAt: 'desc' } });
    assert.ok(row); assert.equal(row.actorId, ids.planner); assert.ok(row.createdAt instanceof Date);
    assert.ok(row.details && typeof row.details === 'object' && 'previousState' in row.details);
  });
});

describe('database privileges, deployment checks and protocol', () => {
  it('uses a non-owner runtime role with RLS enabled on every business table', async () => {
    const result = await db.$queryRaw<{ current_user: string }[]>`SELECT current_user`;
    assert.equal(result[0]?.current_user, 'rk_backend');
    const roles = await db.$queryRaw<{ rolsuper: boolean; rolbypassrls: boolean; rolcreatedb: boolean; rolcreaterole: boolean }[]>`SELECT rolsuper, rolbypassrls, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = current_user`;
    assert.ok(roles.every(r => !r.rolsuper && !r.rolbypassrls && !r.rolcreatedb && !r.rolcreaterole));
    const tables = await owner.$queryRaw<{ relrowsecurity: boolean }[]>`SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'app' AND c.relkind = 'r' AND c.relname <> '_prisma_migrations'`;
    assert.ok(tables.length >= 9); assert.ok(tables.every(t => t.relrowsecurity));
  });
  it('denies anon/authenticated direct business reads and writes, even if schema exposure changes', async () => {
    const sql = new PgClient({ connectionString: process.env.TEST_ADMIN_URL! });
    await sql.connect();
    try {
      for (const role of ['anon', 'authenticated']) {
        await sql.query(`SET ROLE ${role}`);
        await assert.rejects(sql.query('SELECT * FROM app."Wedding"'), /permission denied/);
        await assert.rejects(sql.query('UPDATE app."Wedding" SET title = \'Bypass\''), /permission denied/);
        await sql.query('RESET ROLE');
      }
    } finally { await sql.end(); }
  });
  it('denies runtime schema changes and audit/idempotency tampering', async () => {
    await assert.rejects(db.$executeRaw`CREATE TABLE app.forbidden (id integer)`, /permission denied/);
    await assert.rejects(db.$executeRaw`UPDATE app."AuditLog" SET action = 'tampered'`, /permission denied/);
    await assert.rejects(db.$executeRaw`DELETE FROM app."IdempotencyRecord"`, /permission denied/);
  });
  it('RLS still blocks browser roles if schema/table grants are accidentally added', async () => {
    const sql = new PgClient({ connectionString: process.env.TEST_ADMIN_URL! });
    await sql.connect();
    try {
      await sql.query('BEGIN; GRANT USAGE ON SCHEMA app TO authenticated; GRANT SELECT, UPDATE ON app."Wedding" TO authenticated; SET LOCAL ROLE authenticated');
      assert.equal((await sql.query('SELECT id FROM app."Wedding"')).rows.length, 0);
      assert.equal((await sql.query('UPDATE app."Wedding" SET title = \'Bypass\' RETURNING id')).rows.length, 0);
    } finally { await sql.query('ROLLBACK'); await sql.end(); }
  });
  it('exposes health/readiness and enforces allowed browser origins', async () => {
    await request(app).get('/api/v1/health').expect(200);
    await request(app).get('/api/v1/ready').expect(200);
    const allowed = await api('get', '/me').set('Origin', 'https://frontend.test').expect(200);
    assert.equal(allowed.headers['access-control-allow-origin'], 'https://frontend.test');
    await api('get', '/me').set('Origin', 'https://attacker.test').expect(403);
  });
  it('returns structured errors and validates malformed or oversized JSON', async () => {
    const invalid = await api('get', '/weddings/not-uuid').expect(400);
    assert.equal(invalid.body.error.requestId, invalid.headers['x-request-id']);
    assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(invalid.body.error.fields));
    await request(app).post('/api/v1/clients').set('Content-Type', 'application/json').send('{broken').expect(400);
    await request(app).post('/api/v1/clients').send({ payload: 'x'.repeat(70000) }).expect(413);
  });
  it('publishes OpenAPI schemas, security, roles and idempotency for every business operation', async () => {
    const spec = await request(app).get('/api/v1/openapi.json').expect(200);
    assert.equal(spec.body.openapi, '3.1.0');
    assert.equal(spec.body.paths['/api/v1/weddings/{id}'].patch.requestBody.content['application/json'].schema.additionalProperties, false);
    assert.ok(spec.body.paths['/api/v1/enquiries'].post.parameters.some((p: { name: string }) => p.name === 'Idempotency-Key'));
    assert.deepEqual(spec.body.paths['/api/v1/users'].get['x-roles'], ['FOUNDER']);
  });
});
