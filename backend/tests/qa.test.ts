import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { Client as PgClient } from 'pg';
import request from 'supertest';
import { createApp } from '../src/application.js';

assert.equal(process.env.ROYAL_KNOT_ISOLATED_TEST, 'true');
const db = new PrismaClient();
const owner = new PrismaClient({ datasources: { db: { url: process.env.TEST_ADMIN_URL! } } });
const users = { founder: randomUUID(), planner: randomUUID(), finance: randomUUID(), client: randomUUID(), outsider: randomUUID() };
const app = createApp(db, { async verify(token) { return users[token as keyof typeof users] ?? null; }, async invite() { return randomUUID(); }, async signIn() { return null; }, async refresh() { return null; }, async signOut() {} }, { allowedOrigins: [] });
function api(method: 'get' | 'post' | 'patch' | 'delete', path: string, actor = 'finance', body?: object, key = randomUUID()) { const req = request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${actor}`); if (method !== 'get') req.set('Idempotency-Key', key); return body ? req.send(body) : req; }
const note = 'Fictional test: bank evidence and policy reviewed explicitly.';
let clientId: string;
const settings = { estimatedRevenue: '100.00', contractedRevenue: '100.00', estimatedVendorCost: '70.00', estimatedLabourCost: '10.00', estimatedOtherDirectCost: '0.00', recognitionPolicy: 'Fictional policy: recognize only after the specified service is delivered.' };
async function wedding() {
  const id = (await api('post', '/weddings', 'planner', { clientIds: [clientId], wedding: { title: 'FICTIONAL QA wedding', packageType: 'FULL_SERVICE', weddingDate: '2027-12-20' } }).expect(201)).body.id as string;
  await api('post', `/weddings/${id}/assignments`, 'founder', { userId: users.finance }).expect(201);
  return id;
}
async function vendor(weddingId: string) {
  const id = (await api('post', '/vendors', 'planner', { name: 'FICTIONAL QA DJ', categoryCode: 'DJ_SOUND', contactName: 'QA', email: `${randomUUID()}@qa.invalid`, phone: '+91 9000000000', serviceDetails: 'Fictional sample service' }).expect(201)).body.id;
  return (await api('post', `/weddings/${weddingId}/vendors/client-provided`, 'planner', { vendorId: id, clientProvidedContract: true, note }).expect(201)).body.id as string;
}
async function claim(id: string, amount: string, direction = 'CLIENT_RECEIPT', weddingVendorId?: string, milestone = 'ADVANCE') {
  const row = (await api('post', `/weddings/${id}/payments`, 'finance', { amount, reference: `FICTIONAL-${randomUUID()}`, direction, milestone, ...(weddingVendorId ? { weddingVendorId } : {}), isDemo: true }).expect(201)).body;
  await api('post', `/payments/${row.id}/claim`, 'finance', {}).expect(201);
  return row.id as string;
}
const verify = (id: string) => api('post', `/payments/${id}/verify`, 'finance', { verifiedEvidence: true, note });
before(async () => {
  for (const [role, id] of Object.entries(users)) await owner.userProfile.create({ data: { id, email: `${role}@qa.invalid`, displayName: role, role: role === 'founder' ? 'FOUNDER' : ['finance', 'outsider'].includes(role) ? 'FINANCE' : role === 'client' ? 'CLIENT' : 'PLANNER' } });
  clientId = (await api('post', '/clients', 'founder', { name: 'FICTIONAL QA client', email: 'client@qa.invalid' }).expect(201)).body.id;
  await owner.client.update({ where: { id: clientId }, data: { userId: users.client } });
});
after(async () => { await db.$disconnect(); await owner.$disconnect(); });

describe('Phase 6 regression and financial security QA', () => {
  it('validates decimal rounding and calculation overflow before committing any expense or labour', async () => {
    const id = await wedding();
    const body = { reference: 'ROUNDING', kind: 'OTHER', description: 'Half-paise rounding fixture', quantity: '0.5', unitRate: '0.01', taxRate: '50', clientCharge: '0.00' };
    const row = (await api('post', `/weddings/${id}/expenses`, 'planner', body).expect(201)).body;
    assert.deepEqual([row.netAmount, row.taxAmount, row.total], ['0.01', '0.01', '0.02']);
    const overflow = await api('post', `/weddings/${id}/expenses`, 'planner', { ...body, reference: 'OVERFLOW', quantity: '999999', unitRate: '99999999999999.99' }).expect(400);
    assert.equal(overflow.body.error.code, 'INVALID_FINANCIAL_AMOUNT');
    await api('post', `/weddings/${id}/expenses`, 'planner', { ...body, reference: 'TAX-OVERFLOW', quantity: '1', unitRate: '99999999999999.99', taxRate: '100' }).expect(400);
    assert.equal(await owner.additionalExpense.count({ where: { weddingId: id } }), 1);
    const rate = (await api('post', '/labour-rates', 'founder', { userId: users.planner, hourlyRate: '99999999999999.99', currency: 'INR', effectiveFrom: '2020-01-01T00:00:00Z' }).expect(201)).body;
    await api('post', `/weddings/${id}/labour`, 'planner', { userId: users.planner, rateId: rate.id, reference: 'OVERFLOW-LABOUR', hours: '24', workedAt: new Date(Date.now() - 60000).toISOString() }).expect(400);
    assert.equal(await owner.labourEntry.count({ where: { weddingId: id } }), 0);
  });
  it('serializes different payment references against one payable and retains failed transaction state', async () => {
    const id = await wedding(), association = await vendor(id);
    await api('post', `/weddings/${id}/vendor-contracts`, 'finance', { weddingVendorId: association, amount: '100.00', note }).expect(201);
    const first = await claim(id, '80.00', 'VENDOR_DISBURSEMENT', association), second = await claim(id, '80.00', 'VENDOR_DISBURSEMENT', association);
    const responses = await Promise.all([verify(first), verify(second)]);
    assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
    const winner = responses[0]!.status === 201 ? first : second, loser = winner === first ? second : first;
    assert.equal((await owner.bookingPayment.findUniqueOrThrow({ where: { id: loser } })).status, 'CLAIMED');
    assert.equal(await owner.auditLog.count({ where: { entityId: loser, action: 'PAYMENT_VERIFIED' } }), 0);
    await api('post', `/payments/${winner}/reverse`, 'finance', { note }).expect(201);
    await verify(loser).expect(201);
    const reconciliation = (await api('get', `/weddings/${id}/reconciliation`).expect(200)).body[0];
    assert.equal(reconciliation.cashPaid, '80.00'); assert.equal(reconciliation.estimatedRemainingPayable, '20.00');
  });
  it('protects financial ownership, legacy deposit routes and internal documents', async () => {
    const id = await wedding(), association = await vendor(id);
    const payment = await claim(id, '1.00', 'VENDOR_DISBURSEMENT', association);
    await api('get', `/payments/${payment}`, 'client').expect(404);
    await api('get', `/payments/${payment}`, 'outsider').expect(404);
    await api('post', `/booking-payments/${payment}/verify`, 'finance', { verifiedEvidence: true, note }).expect(404);
    await api('post', `/weddings/${id}/payments`, 'client', { amount: '1.00', reference: 'ESCALATE', direction: 'VENDOR_DISBURSEMENT', milestone: 'ADVANCE', weddingVendorId: association, isDemo: true }).expect(403);
    await api('get', `/weddings/${id}/profitability`, 'planner').expect(403);
    const doc = (await api('post', `/weddings/${id}/documents`, 'finance', { kind: 'VENDOR_BILL', fileName: 'fictional.pdf', contentType: 'application/pdf', size: 100 }).expect(201)).body;
    await api('post', `/documents/${doc.id}/download-url`, 'client').expect(403);
    await api('get', `/weddings/${id}/expenses`, 'outsider').expect(404);
    const profile = await api('get', '/me', 'client').expect(200);
    assert.equal(profile.headers['cache-control'], 'no-store');
  });
  it('keeps recognition policy, currencies and approved contract assumptions explicit', async () => {
    const id = await wedding();
    const initial = (await api('get', `/weddings/${id}/profitability`).expect(200)).body;
    assert.equal(initial.operationalProfit, null); assert.ok(initial.warnings.includes('FINANCE_POLICY_NOT_CONFIGURED'));
    await api('post', `/weddings/${id}/revenue-recognitions`, 'finance', { reference: 'NO-POLICY', amount: '1.00', recognizedAt: new Date().toISOString(), note }).expect(409);
    await api('post', `/weddings/${id}/finance-settings`, 'founder', settings).expect(201);
    await api('patch', `/weddings/${id}`, 'planner', { currency: 'USD' }).expect(409);
    await api('post', `/weddings/${id}/confirm-proposal`, 'planner', { bookingDepositRequired: '101.00' }).expect(409);
    await api('post', `/weddings/${id}/revenue-recognitions`, 'finance', { reference: 'FUTURE', amount: '1.00', recognizedAt: new Date(Date.now() + 3600000).toISOString(), note }).expect(400);
    await api('delete', `/weddings/${id}`, 'planner').expect(409);
  });
  it('prevents non-booking receipts from generating tasks, and permits settlement after completion', async () => {
    const id = await wedding();
    await api('patch', `/weddings/${id}`, 'planner', { state: 'COMPLETED' }).expect(409);
    await api('post', `/weddings/${id}/confirm-proposal`, 'planner', { bookingDepositRequired: '10.00' }).expect(201);
    await verify(await claim(id, '50.00')).expect(201);
    assert.equal(await owner.weddingTask.count({ where: { weddingId: id } }), 0);
    await api('post', `/weddings/${id}/tasks/generate`, 'planner').expect(409);
    await verify(await claim(id, '10.00', 'CLIENT_RECEIPT', undefined, 'BOOKING')).expect(201);
    const laterClaim = (await api('post', `/weddings/${id}/booking-payments`, 'client', { amount: '1.00', reference: `QA-${randomUUID()}`, isDemo: true }).expect(201)).body.id;
    await api('patch', `/weddings/${id}`, 'planner', { state: 'EXECUTION' }).expect(200);
    await api('patch', `/weddings/${id}`, 'planner', { state: 'COMPLETED' }).expect(200);
    await api('patch', `/weddings/${id}`, 'planner', { state: 'EXECUTION' }).expect(409);
    await api('post', `/booking-payments/${laterClaim}/verify`, 'finance', { verifiedEvidence: true, note }).expect(201);
    await verify(await claim(id, '1.00', 'CLIENT_RECEIPT', undefined, 'BOOKING')).expect(201);
    await api('post', `/weddings/${id}/documents`, 'finance', { kind: 'VENDOR_BILL', fileName: 'final.pdf', contentType: 'application/pdf', size: 100 }).expect(201);
    await api('post', `/weddings/${id}/documents`, 'planner', { kind: 'FLOOR_PLAN', fileName: 'plan.pdf', contentType: 'application/pdf', size: 100 }).expect(409);
    assert.equal(await owner.weddingTask.count({ where: { weddingId: id } }), 35);
  });
  it('rejects schedule proposals that would rewrite a completed source or dependent event', async () => {
    const id = await wedding();
    const root = (await api('post', `/weddings/${id}/timeline`, 'planner', { title: 'Varmala', plannedStart: '2027-12-20T19:15:00+05:30', plannedEnd: '2027-12-20T19:30:00+05:30', vendorIds: [], dependsOnIds: [] }).expect(201)).body;
    const child = (await api('post', `/weddings/${id}/timeline`, 'planner', { title: 'Dinner', plannedStart: '2027-12-20T19:30:00+05:30', plannedEnd: '2027-12-20T20:30:00+05:30', vendorIds: [], dependsOnIds: [root.id] }).expect(201)).body;
    await api('post', `/timeline-events/${child.id}/execution`, 'planner', { expectedVersion: 1, status: 'CANCELLED' }).expect(201);
    const timeline = (await api('get', `/weddings/${id}/timeline`, 'planner').expect(200)).body;
    const requestBody = { expectedScheduleVersion: timeline.scheduleVersion, proposedStart: '2027-12-20T19:40:00+05:30', proposedEnd: '2027-12-20T19:55:00+05:30', shiftDependents: true, reason: 'Attempt to move an executed schedule.' };
    for (const eventId of [root.id, child.id]) {
      const result = await api('post', `/timeline-events/${eventId}/schedule-changes`, 'planner', requestBody).expect(409);
      assert.equal(result.body.error.code, 'EVENT_EXECUTION_CLOSED');
    }
    assert.equal(await owner.scheduleChange.count({ where: { weddingId: id } }), 0);
  });
  it('keeps repeated financial submissions retry-safe and rejects changed requests using the same key', async () => {
    const id = await wedding(), key = randomUUID();
    const body = { amount: '1.00', reference: `QA-${randomUUID()}`, direction: 'CLIENT_RECEIPT', milestone: 'FINAL', isDemo: true };
    const [a, b] = await Promise.all([api('post', `/weddings/${id}/payments`, 'client', body, key), api('post', `/weddings/${id}/payments`, 'client', body, key)]);
    assert.equal(a.status, 201); assert.equal(b.status, 201); assert.equal(a.body.id, b.body.id);
    await api('post', `/weddings/${id}/payments`, 'client', { ...body, amount: '2.00' }, key).expect(409);
    assert.equal(await owner.bookingPayment.count({ where: { weddingId: id } }), 1);
  });
});

describe('Phase 6 database inventory and least privilege', () => {
  it('validates every foreign key, browser grant, RLS policy and migration row', async () => {
    const sql = new PgClient({ connectionString: process.env.TEST_ADMIN_URL! }); await sql.connect();
    try {
      const inventory = await sql.query<{ name: string; rls: boolean; browser_access: boolean; backend_policy: boolean }>(`SELECT c.relname AS name, c.relrowsecurity AS rls,
        (has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') OR has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE')) AS browser_access,
        EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid AND p.polroles = ARRAY[(SELECT oid FROM pg_roles WHERE rolname='rk_backend')]) AS backend_policy
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='app' AND c.relkind='r' AND c.relname<>'_prisma_migrations'`);
      assert.ok(inventory.rows.length >= 30);
      for (const row of inventory.rows) assert.deepEqual({ rls: row.rls, browser: row.browser_access, policy: row.backend_policy }, { rls: true, browser: false, policy: true }, row.name);
      assert.equal((await sql.query(`SELECT count(*)::int AS n FROM pg_constraint co JOIN pg_namespace n ON n.oid=co.connamespace WHERE n.nspname='app' AND co.contype='f' AND NOT co.convalidated`)).rows[0].n, 0);
      assert.equal((await sql.query(`SELECT count(*)::int AS n FROM app._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`)).rows[0].n, 10);
      for (const table of ['FinanceSettings', 'LabourRate']) assert.equal((await sql.query(`SELECT has_table_privilege('rk_backend',$1,'UPDATE') AS allowed`, [`app."${table}"`])).rows[0].allowed, false);
    } finally { await sql.end(); }
  });
  it('enforces exact financial calculations and review evidence in PostgreSQL', async () => {
    const id = await wedding();
    const expense = await api('post', `/weddings/${id}/expenses`, 'planner', { reference: 'DB-CHECK', kind: 'OTHER', description: 'Constraint fixture', quantity: '1', unitRate: '1.00', taxRate: '0', clientCharge: '1.00' }).expect(201);
    await assert.rejects(db.$executeRaw`UPDATE app."AdditionalExpense" SET "netAmount"=2,"total"=2 WHERE id=${expense.body.id}::uuid`, /expense_calculation_and_approval/);
    await assert.rejects(db.$executeRaw`UPDATE app."AdditionalExpense" SET status='APPROVED' WHERE id=${expense.body.id}::uuid`, /expense_calculation_and_approval/);
    assert.equal((await owner.additionalExpense.findUniqueOrThrow({ where: { id: expense.body.id } })).status, 'PENDING');
  });
  it('indexes every business foreign-key lookup and enforces same-wedding document references', async () => {
    const missingIndexes = await owner.$queryRaw<{ table_name: string; constraint_name: string }[]>`
      SELECT co.conrelid::regclass::text AS table_name, co.conname AS constraint_name
      FROM pg_constraint co JOIN pg_namespace n ON n.oid=co.connamespace
      WHERE n.nspname='app' AND co.contype='f' AND NOT EXISTS (
        SELECT 1 FROM pg_index i WHERE i.indrelid=co.conrelid AND i.indisvalid
        AND i.indpred IS NULL AND i.indkey[0]=co.conkey[1])`;
    assert.deepEqual(missingIndexes, []);
    const source = await wedding(), target = await wedding(), association = await vendor(target);
    const doc = await owner.document.create({ data: { weddingId: source, kind: 'AGREEMENT', fileName: 'fictional.pdf', contentType: 'application/pdf', size: 1, storagePath: `qa/${randomUUID()}.pdf`, uploadedBy: users.planner } });
    await assert.rejects(owner.agreement.create({ data: { weddingId: target, title: 'Invalid cross-wedding fixture', terms: 'Fictional terms', documentId: doc.id } }), /foreign key constraint/i);
    await assert.rejects(owner.bookingPayment.create({ data: { weddingId: target, amount: '1.00', currency: 'INR', reference: `QA-${randomUUID().toUpperCase()}`, claimedBy: users.client, evidenceDocumentId: doc.id } }), /foreign key constraint/i);
    await assert.rejects(owner.additionalExpense.create({ data: { weddingId: target, reference: 'CROSS-WEDDING', kind: 'OTHER', description: 'Invalid fixture', quantity: 1, unitRate: 1, taxRate: 0, netAmount: 1, taxAmount: 0, total: 1, clientCharge: 0, currency: 'INR', requestedBy: users.planner, supportingDocumentId: doc.id } }), /foreign key constraint/i);
    await assert.rejects(owner.vendorBill.create({ data: { weddingId: target, weddingVendorId: association, reference: `QA-${randomUUID()}`, amount: '1.00', currency: 'INR', dueAt: new Date(), submittedBy: users.finance, documentId: doc.id } }), /foreign key constraint/i);
    assert.equal(await owner.agreement.count({ where: { weddingId: target } }), 0);
  });
  it('does not accept reversed payment records with missing review evidence', async () => {
    const id = await wedding(), payment = await claim(id, '1.00');
    await verify(payment).expect(201);
    await assert.rejects(db.$executeRaw`UPDATE app."BookingPayment" SET status='REVERSED',"reversedBy"=${users.finance}::uuid,"reversedAt"=now(),"reversalNote"=NULL WHERE id=${payment}::uuid`, /payment_review_evidence/);
    assert.equal((await owner.bookingPayment.findUniqueOrThrow({ where: { id: payment } })).status, 'VERIFIED');
  });
});

describe('Schema audit report and workflow regressions', () => {
  it('returns large aggregate amounts as exact strings without widening stored payment inputs', async () => {
    const id = await wedding();
    await api('post', `/weddings/${id}/finance-settings`, 'founder', settings).expect(201);
    for (let i = 0; i < 2; i++) await verify(await claim(id, '90000000000000.00')).expect(201);
    const balance = (await api('get', `/weddings/${id}/client-balance`, 'client').expect(200)).body;
    assert.equal(balance.cashCollected, '180000000000000.00');
    assert.equal(balance.creditBalance, '179999999999900.00');
    const dashboard = (await api('get', `/reports/founder-dashboard?weddingId=${id}`, 'founder').expect(200)).body;
    assert.equal(dashboard.totalsByCurrency[0].cashCollected, balance.cashCollected);
    await api('post', `/weddings/${id}/payments`, 'finance', { amount: '100000000000000.00', reference: 'TOO-LARGE', direction: 'CLIENT_RECEIPT', milestone: 'FINAL', isDemo: true }).expect(400);
  });
  it('caps client milestone dues at the actual balance after receipts against another milestone', async () => {
    const id = await wedding();
    await api('post', `/weddings/${id}/finance-settings`, 'founder', settings).expect(201);
    for (const milestone of ['BOOKING', 'FINAL']) await api('post', `/weddings/${id}/payment-milestones`, 'finance', { milestone, amount: '50.00', dueAt: '2027-01-01T00:00:00Z' }).expect(201);
    await verify(await claim(id, '75.00', 'CLIENT_RECEIPT', undefined, 'BOOKING')).expect(201);
    let dashboard = (await api('get', `/reports/founder-dashboard?weddingId=${id}`, 'founder').expect(200)).body;
    assert.deepEqual(dashboard.upcomingDues.map((row: { amount: string }) => row.amount), ['25.00']);
    await verify(await claim(id, '25.00', 'CLIENT_RECEIPT', undefined, 'BOOKING')).expect(201);
    dashboard = (await api('get', `/reports/founder-dashboard?weddingId=${id}`, 'founder').expect(200)).body;
    assert.deepEqual(dashboard.upcomingDues, []);
  });
  it('prevents closed wedding enquiries from being edited or reassigned', async () => {
    const created = (await api('post', '/enquiries', 'planner', { clientIds: [clientId], wedding: { title: 'FICTIONAL closed enquiry', packageType: 'PARTIAL_DAY_OF' } }).expect(201)).body;
    await api('patch', `/weddings/${created.wedding.id}`, 'planner', { state: 'CANCELLED' }).expect(200);
    await api('patch', `/enquiries/${created.enquiry.id}`, 'planner', { stage: 'CONTACTED' }).expect(409);
    await api('post', `/enquiries/${created.enquiry.id}/assignment`, 'founder', { userId: users.planner }).expect(409);
    assert.equal((await owner.enquiry.findUniqueOrThrow({ where: { id: created.enquiry.id } })).stage, 'NEW');
  });
});
