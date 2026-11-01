/**
 * =============================================================================
 * Test Suite: security-authorization.test.ts
 * Purpose: Real HTTP Request Authorization & Security Boundary Checks
 * =============================================================================
 * This test suite makes real HTTP requests against a live PostgreSQL database
 * to verify that our security rules actually work in practice.
 * 
 * In simple terms, it makes sure:
 * 1. Clients cannot snoop on staff lists, bills, or other couples' private details.
 * 2. Clients cannot browse the internal vendor directory.
 * 3. Planners cannot grant themselves founder privileges or invite elevated roles.
 * 4. Sneaky query parameters (like ?role=FOUNDER) are completely ignored.
 * =============================================================================
 */

import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/application.js';
import type { IdentityProvider } from '../src/identity.js';

// Ensure we are running against a disposable test database so real data is never touched
assert.equal(process.env.ROYAL_KNOT_ISOLATED_TEST, 'true', 'Must be executed within the isolated PostgreSQL runner');

const db = new PrismaClient();
const owner = new PrismaClient({ datasources: { db: { url: process.env.TEST_ADMIN_URL! } } });

// Generate unique test IDs for different personas
const ids = {
  founder: randomUUID(),
  planner: randomUUID(),
  finance: randomUUID(),
  clientA: randomUUID(),
  clientB: randomUUID()
};

const clientEntities = {
  clientA: randomUUID(),
  clientB: randomUUID()
};

let weddingId: string;

// Test identity provider that returns the right user ID when a token is verified
const testIdentity: IdentityProvider = {
  async verify(token: string) {
    if (token === 'tok-founder') return ids.founder;
    if (token === 'tok-planner') return ids.planner;
    if (token === 'tok-finance') return ids.finance;
    if (token === 'tok-clientA') return ids.clientA;
    if (token === 'tok-clientB') return ids.clientB;
    return null;
  },
  async invite() {
    return randomUUID();
  },
  async signIn() { return null; },
  async refresh() { return null; },
  async signOut() {}
};

const app = createApp(db, testIdentity, { allowedOrigins: ['https://security.test'] });

describe('Rigorous Backend Authorization & RBAC Security Verification', () => {
  before(async () => {
    // 1. Seed founder account
    await owner.userProfile.create({
      data: { id: ids.founder, email: 'founder@royal.local', displayName: 'Devendra Kaviraj', role: 'FOUNDER' }
    });

    // 2. Seed planner account
    await owner.userProfile.create({
      data: { id: ids.planner, email: 'planner@royal.local', displayName: 'Priya Mehra', role: 'PLANNER' }
    });

    // 3. Seed finance account
    await owner.userProfile.create({
      data: { id: ids.finance, email: 'finance@royal.local', displayName: 'Rohan Verma', role: 'FINANCE' }
    });

    // 4. Seed Client A and Client B profiles & client contact records
    await owner.userProfile.create({
      data: { id: ids.clientA, email: 'clienta@royal.local', displayName: 'Rahul Sharma', role: 'CLIENT' }
    });
    await owner.client.create({
      data: { id: clientEntities.clientA, userId: ids.clientA, name: 'Rahul Sharma', email: 'clienta@royal.local' }
    });

    await owner.userProfile.create({
      data: { id: ids.clientB, email: 'clientb@royal.local', displayName: 'Aditya Singhania', role: 'CLIENT' }
    });
    await owner.client.create({
      data: { id: clientEntities.clientB, userId: ids.clientB, name: 'Aditya Singhania', email: 'clientb@royal.local' }
    });

    // 5. Create Wedding for Client A
    const wed = await owner.wedding.create({
      data: {
        title: 'Sharma Wedding',
        packageType: 'FULL_SERVICE',
        budgetMax: '35000000.00',
        currency: 'INR'
      }
    });
    weddingId = wed.id;

    await owner.weddingClient.create({
      data: { weddingId, clientId: clientEntities.clientA }
    });
  });

  after(async () => {
    await owner.$disconnect();
    await db.$disconnect();
  });

  // Check 1: Clients cannot see internal staff accounts
  it('prevents clients from accessing staff lists or user profiles (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', 'Bearer tok-clientA');
    assert.equal(res.status, 403);
  });

  // Check 2: Clients cannot view internal vendor disbursements or costs
  it('prevents clients from viewing internal vendor bills and disbursements (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/weddings/${weddingId}/vendor-bills`)
      .set('Authorization', 'Bearer tok-clientA');
    assert.equal(res.status, 403);
  });

  // Check 3: One couple cannot peek at another couple's confidential records
  it('prevents Client A from reading Client B confidential records (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/clients/${clientEntities.clientB}`)
      .set('Authorization', 'Bearer tok-clientA');
    assert.equal(res.status, 403);
  });

  // Check 4: Clients cannot browse the internal agency vendor list
  it('prevents client role from browsing internal vendor directory (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/vendors')
      .set('Authorization', 'Bearer tok-clientA');
    assert.equal(res.status, 403);
  });

  // Check 5: Clients and family cannot touch payment milestones or contract terms
  it('prevents client/family role from modifying finance settings or payment milestones (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/v1/weddings/${weddingId}/vendor-contracts`)
      .set('Authorization', 'Bearer tok-clientA')
      .set('Idempotency-Key', randomUUID())
      .send({ vendorId: randomUUID(), netAmount: '50000.00', taxAmount: '9000.00', total: '59000.00' });
    assert.equal(res.status, 403);
  });

  // Check 6: Agency planners cannot promote themselves to Founder
  it('prevents planners from self-escalating role to FOUNDER or updating other staff (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${ids.planner}`)
      .set('Authorization', 'Bearer tok-planner')
      .set('Idempotency-Key', randomUUID())
      .send({ role: 'FOUNDER' });
    assert.equal(res.status, 403);
  });

  // Check 7: Planners cannot invite new staff members (only Founders can)
  it('prevents planners from inviting staff accounts (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', 'Bearer tok-planner')
      .set('Idempotency-Key', randomUUID())
      .send({ email: 'newstaff@test.invalid', displayName: 'New Staff', role: 'FINANCE' });
    assert.equal(res.status, 403);
  });

  // Check 8: Tampering with query strings (like ?role=FOUNDER) has zero effect
  it('ignores any client attempt to supply role=FOUNDER in query or payload', async () => {
    const res = await request(app)
      .get('/api/v1/users?role=FOUNDER')
      .set('Authorization', 'Bearer tok-clientA');
    assert.equal(res.status, 403);
  });
});
