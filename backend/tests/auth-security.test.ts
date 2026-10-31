import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/application.js';
import { ApiError } from '../src/errors.js';
import { readConfig } from '../src/config.js';
import { consumeAuthLimit } from '../src/services/rate-limit.js';
import type { IdentityProvider, IdentitySession } from '../src/identity.js';

assert.equal(process.env.ROYAL_KNOT_ISOLATED_TEST, 'true');
const db = new PrismaClient();
const owner = new PrismaClient({ datasources: { db: { url: process.env.TEST_ADMIN_URL! } } });
const ids = { founder: randomUUID(), a: randomUUID(), b: randomUUID(), disabled: randomUUID(), uninvited: randomUUID() };
const password = '  Valid Fictional Test Passphrase!  ';
const issued = new Map<string, string>();
const revoked: string[] = [];
let signIns = 0, invitations = 0;
let refreshUsed = false;
function session(actor: keyof typeof ids): IdentitySession {
  const token = `issued-${actor}-${randomUUID()}`; issued.set(token, ids[actor]);
  return { userId: ids[actor], accessToken: token, refreshToken: `refresh-${actor}-${randomUUID()}`, expiresAt: Math.floor(Date.now() / 1000) + 3600, tokenType: 'bearer' };
}
const identity: IdentityProvider = {
  async verify(token) {
    if (token === 'throw') throw new Error('provider-private-secret should not escape');
    if (token === 'malformed-id') return 'not-a-uuid';
    return issued.get(token) ?? ids[token as keyof typeof ids] ?? null;
  },
  async invite() { invitations++; return randomUUID(); },
  async signIn(email, suppliedPassword) {
    signIns++;
    const actor = email.split('@')[0]!;
    if (actor === 'throw') throw new Error('provider-private-secret should not escape');
    if (actor === 'throttled') throw new ApiError(429, 'AUTH_RATE_LIMITED', 'Try again later');
    if (suppliedPassword !== password) return null;
    if (actor === 'expired') return { ...session('a'), expiresAt: Math.floor(Date.now() / 1000) - 1 };
    if (actor === 'bad-session') return { ...session('a'), refreshToken: '' };
    if (actor === 'bad-id') return { ...session('a'), userId: 'not-a-uuid' };
    return actor in ids ? session(actor as keyof typeof ids) : null;
  },
  async refresh(token) {
    if (token === 'throw') throw new Error('provider-private-secret should not escape');
    if (token !== 'one-use-fixture' || refreshUsed) return null;
    refreshUsed = true; return session('a');
  },
  async signOut(token) { if (token === 'b') throw new Error('provider-private-secret should not escape'); revoked.push(token); },
};
const app = createApp(db, identity, { allowedOrigins: ['https://security.test'] });
function api(method: 'get' | 'post' | 'patch', path: string, actor = 'founder', body?: object, key = randomUUID()) { const call = request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${actor}`); if (method !== 'get') call.set('Idempotency-Key', key); return body ? call.send(body) : call; }
const login = (actor: string, suppliedPassword = password) => request(app).post('/api/v1/auth/login').send({ email: `${actor}@auth-security.invalid`, password: suppliedPassword });
before(async () => {
  // This is the disposable cluster only; make auth-rate fixtures independent of other serial test files.
  await owner.rateLimitBucket.deleteMany();
  for (const actor of ['founder', 'a', 'b', 'disabled'] as const) await owner.userProfile.create({ data: { id: ids[actor], email: `${actor}@auth-security.invalid`, displayName: actor, role: actor === 'founder' ? 'FOUNDER' : actor === 'b' ? 'FINANCE' : 'PLANNER', active: actor !== 'disabled' } });
});
after(async () => { await owner.rateLimitBucket.deleteMany(); await db.$disconnect(); await owner.$disconnect(); });

describe('Authentication request, session and double-interaction security', () => {
  it('rejects malformed login/refresh payloads before contacting identity and preserves passwords exactly', async () => {
    const before = signIns;
    for (const body of [{}, { email: 'invalid', password }, { email: 'a@auth-security.invalid', password: '' }, { email: 'a@auth-security.invalid', password: 123 }, { email: 'a@auth-security.invalid', password, role: 'FOUNDER' }, { email: 'a@auth-security.invalid', password: 'x'.repeat(1025) }]) await request(app).post('/api/v1/auth/login').send(body).expect(400);
    await request(app).post('/api/v1/auth/login?role=FOUNDER').send({ email: 'a@auth-security.invalid', password }).expect(400);
    for (const refreshToken of ['', ' ', 'with whitespace', 'x'.repeat(4097)]) await request(app).post('/api/v1/auth/refresh').send({ refreshToken }).expect(400);
    assert.equal(signIns, before);
    await login('a', password.trim()).expect(401);
    const valid = await request(app).post('/api/v1/auth/login').send({ email: 'A@AUTH-SECURITY.INVALID', password }).expect(200);
    assert.equal(valid.body.user.id, ids.a); assert.equal(valid.headers['cache-control'], 'no-store');
  });
  it('keeps concurrent logins isolated and never caches credentials or issued tokens', async () => {
    const before = await owner.userProfile.count();
    const responses = await Promise.all([login('a'), login('b'), login('a')]);
    assert.ok(responses.every(r => r.status === 200));
    assert.deepEqual(responses.map(r => r.body.user.id), [ids.a, ids.b, ids.a]);
    assert.equal(new Set(responses.map(r => r.body.accessToken)).size, 3);
    for (const response of responses) assert.equal((await api('get', '/me', response.body.accessToken).expect(200)).body.id, response.body.user.id);
    assert.equal(await owner.userProfile.count(), before);
    const persisted = JSON.stringify([await owner.auditLog.findMany(), await owner.idempotencyRecord.findMany(), await owner.rateLimitBucket.findMany()]);
    assert.ok(!persisted.includes(password));
    for (const response of responses) { assert.ok(!persisted.includes(response.body.accessToken)); assert.ok(!persisted.includes(response.body.refreshToken)); }
  });
  it('rejects uninvited, disabled, expired and malformed issued sessions and attempts revocation', async () => {
    const before = revoked.length;
    for (const actor of ['disabled', 'uninvited']) await login(actor).expect(403);
    await login('expired').expect(401);
    await login('bad-session').expect(503);
    await login('bad-id').expect(503);
    assert.equal(revoked.length - before, 5);
    assert.equal(await owner.userProfile.findUnique({ where: { id: ids.uninvited } }), null);
    await api('get', '/me', 'malformed-id').expect(503);
    await api('post', '/auth/logout', 'disabled', {}).expect(200);
  });
  it('returns safe auth-unavailable errors on all provider paths and preserves throttling', async () => {
    const responses = [await login('throw').expect(503), await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'throw' }).expect(503), await api('post', '/auth/logout', 'throw', {}).expect(503), await api('post', '/auth/logout', 'b', {}).expect(503), await api('get', '/me', 'throw').expect(503)];
    for (const response of responses) { assert.equal(response.body.error.code, 'AUTH_UNAVAILABLE'); assert.ok(response.body.error.requestId); assert.ok(!JSON.stringify(response.body).includes('provider-private-secret')); }
    const limited = await login('throttled').expect(429); assert.equal(limited.headers['retry-after'], '60');
    for (const authorization of ['Basic abc', 'Bearer', 'Bearer a extra']) await request(app).get('/api/v1/me').set('Authorization', authorization).expect(401);
  });
  it('honours provider refresh-reuse rejection without caching or replaying another session', async () => {
    const requests = [1, 2].map(() => request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'one-use-fixture' }));
    const results = await Promise.all(requests);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 401]);
    assert.equal(results.find(r => r.status === 200)!.body.user.id, ids.a);
    assert.ok(!('accessToken' in results.find(r => r.status === 401)!.body));
  });
  it('enforces a shared atomic rate budget under parallel attempts and resets only after 60 seconds', async () => {
    const scope = `audit-${randomUUID()}`;
    const results = await Promise.allSettled(Array.from({ length: 20 }, () => consumeAuthLimit(db, scope, 'fictional-identity', 5)));
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 5);
    for (const result of results) if (result.status === 'rejected') assert.equal(result.reason.code, 'AUTH_RATE_LIMITED');
    const rows = await owner.rateLimitBucket.findMany({ where: { count: 20 } }); assert.equal(rows.length, 1);
    const row = rows[0]!;
    await owner.rateLimitBucket.update({ where: { key: row.key }, data: { windowStart: new Date(Date.now() - 61000) } });
    await consumeAuthLimit(db, scope, 'fictional-identity', 5);
    assert.equal((await owner.rateLimitBucket.findUniqueOrThrow({ where: { key: row.key } })).count, 1);
  });
  it('serializes duplicate business submissions and invitations without duplicate records or escalation', async () => {
    const key = randomUUID(), email = `${randomUUID()}@auth-security.invalid`, body = { name: 'FICTIONAL duplicate client', email };
    const results = await Promise.all([api('post', '/clients', 'founder', body, key), api('post', '/clients', 'founder', body, key)]);
    assert.ok(results.every(r => r.status === 201)); assert.equal(results[0]!.body.id, results[1]!.body.id);
    assert.equal(await owner.client.count({ where: { email } }), 1);
    const inviteEmail = `${randomUUID()}@auth-security.invalid`, previous = invitations;
    const invites = await Promise.all([1, 2].map(() => api('post', '/invitations', 'founder', { email: inviteEmail, displayName: 'Fictional staff', role: 'PLANNER' })));
    assert.ok(invites.every(r => r.status === 201)); assert.equal(invites[0]!.body.id, invites[1]!.body.id);
    assert.equal(invitations - previous, 1); assert.equal(await owner.userProfile.count({ where: { email: inviteEmail } }), 1);
    await owner.userProfile.update({ where: { id: ids.a }, data: { active: false } });
    try { await api('get', '/me', 'a').expect(403); await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'one-use-fixture' }).expect(401); } finally { await owner.userProfile.update({ where: { id: ids.a }, data: { active: true } }); }
  });
});

async function waitingOnProfile() {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    // Poll outside the locking transaction so PostgreSQL does not reuse its statistics snapshot.
    const rows = await owner.$queryRaw<{ count: bigint }[]>`SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND wait_event_type='Lock' AND query LIKE '%UserProfile%FOR SHARE%'`;
    if (Number(rows[0]!.count) > 0) return;
    await delay(10);
  }
  throw new Error('Request did not reach the profile-lock boundary');
}
it('rechecks deactivation and role changes after queued requests pass initial authentication', async () => {
  for (const change of [{ active: false }, { role: 'FINANCE' as const }]) {
    const email = `${randomUUID()}@auth-security.invalid`;
    let pending: Promise<request.Response> | undefined;
    try {
      await owner.$transaction(async tx => {
        await tx.userProfile.update({ where: { id: ids.a }, data: change });
        pending = api('post', '/clients', 'a', { name: 'FICTIONAL queued client', email }).then(response => response);
        await waitingOnProfile();
      }, { timeout: 10000 });
      const response = await pending!;
      assert.equal(response.status, 403); assert.equal(await owner.client.count({ where: { email } }), 0);
    } finally { await pending; await owner.userProfile.update({ where: { id: ids.a }, data: { active: true, role: 'PLANNER' } }); }
  }
});
it('requires encrypted remote auth/callback origins while supporting loopback development', () => {
  const base = { DATABASE_URL: 'postgresql://fixture:fixture@127.0.0.1:1/test', SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fictional-server-key-only', ALLOWED_ORIGINS: 'https://frontend.test', AUTH_REDIRECT_URL: 'https://frontend.test/auth/callback' };
  assert.throws(() => readConfig({ ...base, SUPABASE_URL: 'http://remote.test' }));
  assert.throws(() => readConfig({ ...base, ALLOWED_ORIGINS: 'http://frontend.test', AUTH_REDIRECT_URL: 'http://frontend.test/auth/callback' }));
  assert.throws(() => readConfig({ ...base, SUPABASE_URL: 'https://user:password@project.supabase.co' }));
  assert.deepEqual(readConfig({ ...base, SUPABASE_URL: 'http://127.0.0.1:54321', ALLOWED_ORIGINS: 'http://localhost:5173', AUTH_REDIRECT_URL: 'http://localhost:5173/auth/callback' }).allowedOrigins, ['http://localhost:5173']);
});
