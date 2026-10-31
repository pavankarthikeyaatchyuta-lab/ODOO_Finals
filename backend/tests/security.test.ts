import { after, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/application.js';

assert.equal(process.env.ROYAL_KNOT_ISOLATED_TEST, 'true', 'Use the isolated PostgreSQL runner');
const db = new PrismaClient();
const identity = { async verify() { return randomUUID(); }, async invite() { return randomUUID(); }, async signIn() { return null; }, async refresh() { return null; }, async signOut() {} };
after(async () => { await db.$disconnect(); });
it('persists authentication attempt limits and returns Retry-After without retaining credentials', async () => {
  const app = createApp(db, identity, { allowedOrigins: [] });
  const email = `${randomUUID()}@security.invalid`;
  for (let i = 0; i < 10; i++) await request(app).post('/api/v1/auth/login').send({ email, password: 'not-a-real-password' }).expect(401);
  const limited = await request(app).post('/api/v1/auth/login').send({ email, password: 'not-a-real-password' }).expect(429);
  assert.equal(limited.headers['retry-after'], '60');
  const buckets = await db.$queryRaw<{ key: string }[]>`SELECT key FROM app."RateLimitBucket"`;
  assert.ok(buckets.every(row => /^[0-9a-f]{64}$/.test(row.key)));
});
it('returns safe database-unavailable responses from readiness and protected routes', async () => {
  const failed = new PrismaClient({ datasources: { db: { url: 'postgresql://isolated_test:unavailable@127.0.0.1:1/unavailable?connect_timeout=1' } } });
  try {
    const app = createApp(failed, identity, { allowedOrigins: [] });
    await request(app).get('/api/v1/health').expect(200);
    await request(app).get('/api/v1/ready').expect(503);
    const response = await request(app).get('/api/v1/me').set('Authorization', 'Bearer fixture').expect(503);
    assert.equal(response.body.error.code, 'DATABASE_UNAVAILABLE');
    assert.ok(!JSON.stringify(response.body).includes('postgresql://'));
  } finally { await failed.$disconnect(); }
});
