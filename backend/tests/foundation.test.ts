import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/application.js';
import { readConfig } from '../src/config.js';
import { ApiError } from '../src/errors.js';
import type { IdentitySession } from '../src/identity.js';

assert.equal(process.env.ROYAL_KNOT_ISOLATED_TEST, 'true', 'Use npm test with its disposable database');
const db = new PrismaClient();
const owner = new PrismaClient({ datasources: { db: { url: process.env.TEST_ADMIN_URL! } } });
const users = { admin: randomUUID(), planner: randomUUID(), client: randomUUID(), inactive: randomUUID(), uninvited: randomUUID() };
const revoked: string[] = [];
function session(actor: keyof typeof users): IdentitySession {
  return { userId: users[actor], accessToken: actor, refreshToken: `refresh-${actor}`, expiresAt: Math.floor(Date.now() / 1000) + 3600, tokenType: 'bearer' };
}
const app = createApp(db, {
  async verify(token) { return users[token as keyof typeof users] ?? null; },
  async invite() { return randomUUID(); },
  async signIn(email, password) {
    if (email === 'outage@foundation.invalid') throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable');
    const actor = email.split('@')[0] as keyof typeof users;
    return password === 'correct password' && users[actor] ? session(actor) : null;
  },
  async refresh(token) { return token.startsWith('refresh-') && users[token.slice(8) as keyof typeof users] ? session(token.slice(8) as keyof typeof users) : null; },
  async signOut(token) { revoked.push(token); },
}, { allowedOrigins: ['https://foundation.test'] });
function api(method: 'get' | 'post' | 'patch' | 'delete', path: string, actor = 'admin', body?: object, key = randomUUID()) {
  const call = request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${actor}`);
  if (method !== 'get') call.set('Idempotency-Key', key);
  return body ? call.send(body) : call;
}
async function contact() { return (await api('post', '/clients', 'admin', { name: 'Foundation contact', email: `${randomUUID()}@foundation.invalid` }).expect(201)).body; }
async function wedding(clientId: string, actor = 'admin') {
  return (await api('post', '/weddings', actor, { clientIds: [clientId], wedding: { title: 'Foundation wedding', packageType: 'FULL_SERVICE', weddingDate: null } }).expect(201)).body;
}
before(async () => {
  for (const actor of ['admin', 'planner', 'client', 'inactive'] as const) await owner.userProfile.create({ data: {
    id: users[actor], email: `${actor}@foundation.invalid`, displayName: actor,
    role: actor === 'admin' ? 'FOUNDER' : actor === 'client' ? 'CLIENT' : 'PLANNER', active: actor !== 'inactive',
  } });
});
after(async () => { await db.$disconnect(); await owner.$disconnect(); });

describe('Express authentication endpoints', () => {
  it('logs in using the existing invited profile and returns only the session contract', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({ email: 'ADMIN@foundation.invalid', password: 'correct password' }).expect(200);
    assert.equal(response.body.user.id, users.admin);
    assert.equal(response.body.user.role, 'FOUNDER');
    assert.deepEqual(Object.keys(response.body).sort(), ['accessToken', 'refreshToken', 'expiresAt', 'tokenType', 'user'].sort());
    assert.equal(response.headers['cache-control'], 'no-store');
    const cache = await owner.idempotencyRecord.findMany();
    assert.ok(cache.every(row => !JSON.stringify(row.response).includes('correct password') && !JSON.stringify(row.response).includes('refresh-admin')));
  });
  it('rejects wrong credentials, deactivated profiles and uninvited identities without creating users', async () => {
    await request(app).post('/api/v1/auth/login').send({ email: 'admin@foundation.invalid', password: 'wrong' }).expect(401);
    for (const actor of ['inactive', 'uninvited']) {
      await request(app).post('/api/v1/auth/login').send({ email: `${actor}@foundation.invalid`, password: 'correct password' }).expect(403);
      assert.ok(revoked.includes(actor));
    }
    assert.equal(await owner.userProfile.findUnique({ where: { id: users.uninvited } }), null);
  });
  it('refreshes sessions, checks active membership again and rejects invalid refresh tokens', async () => {
    const response = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'refresh-admin' }).expect(200);
    assert.equal(response.body.user.id, users.admin);
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'invalid' }).expect(401);
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'refresh-inactive' }).expect(403);
  });
  it('protects logout and permits disabled accounts to end their session', async () => {
    await request(app).post('/api/v1/auth/logout').send({}).expect(401);
    await api('post', '/auth/logout', 'invalid', {}).expect(401);
    assert.deepEqual((await api('post', '/auth/logout', 'admin', {}).expect(200)).body, { success: true });
    await api('post', '/auth/logout', 'inactive', {}).expect(200);
    assert.ok(revoked.includes('admin'));
  });
  it('validates auth requests, protects roles and reports provider failures without secrets', async () => {
    await request(app).post('/api/v1/auth/login').send({ email: 'admin@foundation.invalid', password: 'correct password', role: 'FOUNDER' }).expect(400);
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: '' }).expect(400);
    const failure = await request(app).post('/api/v1/auth/login').send({ email: 'outage@foundation.invalid', password: 'correct password' }).expect(503);
    assert.equal(failure.body.error.code, 'AUTH_UNAVAILABLE');
    assert.ok(!JSON.stringify(failure.body).includes('correct password'));
  });
});

describe('foundation CRUD, schema and archival', () => {
  it('creates a direct provisional wedding with stable identity, scoped assignment and no duplicate enquiry', async () => {
    const client = await contact();
    const count = await owner.enquiry.count();
    const created = await wedding(client.id, 'planner');
    assert.equal(created.state, 'ENQUIRY');
    assert.ok(created.assignedUserIds.includes(users.planner));
    assert.equal(await owner.enquiry.count(), count);
    await api('patch', `/weddings/${created.id}`, 'planner', { title: 'Updated foundation title' }).expect(200);
    assert.equal((await api('get', `/weddings/${created.id}`, 'planner').expect(200)).body.id, created.id);
    await api('post', '/weddings', 'client', { clientIds: [client.id], wedding: { title: 'Forbidden', packageType: 'FULL_SERVICE' } }).expect(403);
  });
  it('retries direct wedding creation safely and rejects archived or duplicate contact links', async () => {
    const client = await contact(), key = randomUUID();
    const body = { clientIds: [client.id], wedding: { title: 'Retry direct creation', packageType: 'FULL_SERVICE' } };
    const first = await api('post', '/weddings', 'admin', body, key).expect(201);
    assert.deepEqual((await api('post', '/weddings', 'admin', body, key).expect(201)).body, first.body);
    await api('post', '/weddings', 'admin', { ...body, clientIds: [client.id, client.id] }).expect(400);
    const unused = await contact();
    await api('delete', `/clients/${unused.id}`).expect(200);
    await api('post', '/weddings', 'admin', { ...body, clientIds: [unused.id] }).expect(400);
  });
  it('supports client update/read and founder-only deletion without losing the database identity', async () => {
    const client = await contact();
    await api('patch', `/clients/${client.id}`, 'admin', { name: 'Updated contact', phone: '+91 9876543210' }).expect(200);
    assert.equal((await api('get', `/clients/${client.id}`).expect(200)).body.name, 'Updated contact');
    await api('delete', `/clients/${client.id}`, 'planner').expect(403);
    const key = randomUUID();
    const removed = await api('delete', `/clients/${client.id}`, 'admin', undefined, key).expect(200);
    assert.deepEqual((await api('delete', `/clients/${client.id}`, 'admin', undefined, key).expect(200)).body, removed.body);
    await api('get', `/clients/${client.id}`).expect(404);
    assert.ok((await owner.client.findUniqueOrThrow({ where: { id: client.id } })).archivedAt);
    assert.ok(!(await api('get', '/clients?pageSize=100').expect(200)).body.data.some((row: { id: string }) => row.id === client.id));
  });
  it('archives weddings with linked enquiry history and makes child records inaccessible', async () => {
    const client = await contact();
    const created = await api('post', '/enquiries', 'admin', { clientIds: [client.id], wedding: { title: 'Archive enquiry wedding', packageType: 'PARTIAL_DAY_OF' } }).expect(201);
    const id = created.body.wedding.id, enquiryId = created.body.enquiry.id;
    await api('delete', `/clients/${client.id}`).expect(409);
    await api('delete', `/weddings/${id}`, 'planner').expect(404);
    const key = randomUUID();
    const archived = await api('delete', `/weddings/${id}`, 'admin', undefined, key).expect(200);
    assert.deepEqual((await api('delete', `/weddings/${id}`, 'admin', undefined, key).expect(200)).body, archived.body);
    await api('get', `/weddings/${id}`).expect(404);
    await api('get', `/enquiries/${enquiryId}`).expect(404);
    await api('patch', `/weddings/${id}`, 'admin', { title: 'Revive' }).expect(404);
    assert.equal((await owner.enquiry.findUniqueOrThrow({ where: { id: enquiryId } })).weddingId, id);
    await api('delete', `/clients/${client.id}`).expect(200);
  });
  it('blocks archival while consultations are pending and rejects requests after archival', async () => {
    const created = await wedding((await contact()).id);
    const pending = await api('post', '/consultations', 'admin', { weddingId: created.id, preferredAt: new Date(Date.now() + 3600000).toISOString() }).expect(201);
    await api('delete', `/weddings/${created.id}`).expect(409);
    await api('patch', `/consultations/${pending.body.id}`, 'admin', { state: 'CANCELLED' }).expect(200);
    await api('delete', `/weddings/${created.id}`).expect(200);
    await api('get', `/consultations/${pending.body.id}`).expect(404);
    await api('post', '/consultations', 'admin', { weddingId: created.id, preferredAt: new Date(Date.now() + 3600000).toISOString() }).expect(404);
  });
  it('protects individual user profiles and uses existing roles rather than parallel user tables', async () => {
    assert.equal((await api('get', `/users/${users.planner}`).expect(200)).body.role, 'PLANNER');
    await api('get', `/users/${users.admin}`, 'planner').expect(403);
    await api('get', `/users/${randomUUID()}`).expect(404);
  });
  it('links function records to the same wedding UUID and enforces basic time integrity', async () => {
    const created = await wedding((await contact()).id);
    const record = await db.weddingFunction.create({ data: { weddingId: created.id, type: 'MEHENDI', name: 'Mehendi' } });
    assert.equal(record.weddingId, created.id);
    await assert.rejects(db.weddingFunction.create({ data: { weddingId: created.id, type: 'MEHENDI', name: 'Mehendi' } }));
    await assert.rejects(db.weddingFunction.create({ data: { weddingId: randomUUID(), type: 'SANGEET', name: 'Invalid parent' } }));
    await assert.rejects(db.weddingFunction.create({ data: { weddingId: created.id, type: 'RECEPTION', name: 'Bad interval', startAt: new Date() } }));
  });
});

it('validates PostgreSQL URLs, exact allowed origins and matching callbacks without exposing credentials', () => {
  const base = { DATABASE_URL: 'postgresql://test:test@localhost:5432/test', SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-only-testing-value', ALLOWED_ORIGINS: 'https://foundation.test', AUTH_REDIRECT_URL: 'https://foundation.test/auth/callback' };
  assert.deepEqual(readConfig(base).allowedOrigins, ['https://foundation.test']);
  assert.throws(() => readConfig({ ...base, DATABASE_URL: 'https://not-postgres.test' }));
  assert.throws(() => readConfig({ ...base, ALLOWED_ORIGINS: 'https://foundation.test/path' }));
  assert.throws(() => readConfig({ ...base, AUTH_REDIRECT_URL: 'https://attacker.test/callback' }));
  assert.throws(() => readConfig({ ...base, SUPABASE_SERVICE_ROLE_KEY: undefined }));
});
