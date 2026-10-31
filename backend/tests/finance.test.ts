import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/application.js';

assert.equal(process.env.ROYAL_KNOT_ISOLATED_TEST, 'true');
const db = new PrismaClient();
const owner = new PrismaClient({ datasources: { db: { url: process.env.TEST_ADMIN_URL! } } });
const users = { founder: randomUUID(), planner: randomUUID(), coordinator: randomUUID(), other: randomUUID(), finance: randomUUID(), client: randomUUID() };
const app = createApp(db, { async verify(token) { return users[token as keyof typeof users] ?? null; }, async invite() { return randomUUID(); }, async signIn() { return null; }, async refresh() { return null; }, async signOut() {} }, { allowedOrigins: [] });
function api(method: 'get' | 'post' | 'patch', path: string, actor = 'finance', body?: object, key = randomUUID()) { const req = request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${actor}`); if (method !== 'get') req.set('Idempotency-Key', key); return body ? req.send(body) : req; }
const note = 'Checked against the bank statement line for this fictional demo.';
const past = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();
// Independent paise arithmetic: every expected rupee value below is derived from integers, never from the API.
const rupees = (paise: number) => `${Math.trunc(paise / 100)}.${String(paise % 100).padStart(2, '0')}`;
const line = (qty: number, ratePaise: number, taxPct: number) => { const net = qty * ratePaise; const tax = Math.round(net * taxPct / 100); return { net, tax, total: net + tax }; };
const L = 100; // paise per rupee

let clientId: string;
before(async () => {
  for (const [role, id] of Object.entries(users)) await owner.userProfile.create({ data: { id, email: `${role}@finance.invalid`, displayName: role, role: role === 'founder' ? 'FOUNDER' : role === 'coordinator' ? 'COORDINATOR' : role === 'client' ? 'CLIENT' : role === 'finance' ? 'FINANCE' : 'PLANNER' } });
  clientId = (await api('post', '/clients', 'founder', { name: 'Fictional finance family', email: 'client@finance.invalid' }).expect(201)).body.id;
  await owner.client.update({ where: { id: clientId }, data: { userId: users.client } });
});
after(async () => { await db.$disconnect(); await owner.$disconnect(); });

async function receipt(weddingId: string, milestone: string, amount: string, actor = 'client') {
  const p = await api('post', `/weddings/${weddingId}/payments`, actor, { amount, reference: `UTR-${randomUUID()}`, direction: 'CLIENT_RECEIPT', milestone, isDemo: true }).expect(201);
  assert.equal(p.body.status, 'INITIATED');
  const claimed = await api('post', `/payments/${p.body.id}/claim`, actor, {}).expect(201);
  assert.equal(claimed.body.status, 'CLAIMED');
  return claimed.body.id as string;
}
async function vendorPayment(weddingId: string, weddingVendorId: string, milestone: string, amount: string) {
  const p = await api('post', `/weddings/${weddingId}/payments`, 'finance', { amount, reference: `NEFT-${randomUUID()}`, direction: 'VENDOR_DISBURSEMENT', milestone, weddingVendorId, isDemo: true }).expect(201);
  await api('post', `/payments/${p.body.id}/claim`, 'finance', {}).expect(201);
  return p.body.id as string;
}
const verify = (id: string) => api('post', `/payments/${id}/verify`, 'finance', { verifiedEvidence: true, note });

describe('Phase 5 financial management: 400 + 60 guest sample wedding', () => {
  it('reconciles vendors, client balances, labour and profitability exactly', async () => {
    const wedding = await api('post', '/weddings', 'planner', { clientIds: [clientId], wedding: { title: 'Fictional 400 guest wedding', packageType: 'FULL_SERVICE', weddingDate: '2027-02-14', location: 'Jaipur' } }).expect(201);
    const id = wedding.body.id as string;
    for (const role of ['coordinator', 'finance'] as const) await api('post', `/weddings/${id}/assignments`, 'founder', { userId: users[role] }).expect(201);
    const wv: Record<string, string> = {};
    for (const code of ['CATERING', 'DJ_SOUND', 'DECOR']) {
      const vendor = await api('post', '/vendors', 'planner', { name: `Fictional ${code} ${randomUUID()}`, categoryCode: code, contactName: 'Manager', email: `${randomUUID()}@finance.invalid`, phone: '+91 9999999999', serviceDetails: 'Client-contracted wedding service' }).expect(201);
      wv[code] = (await api('post', `/weddings/${id}/vendors/client-provided`, 'planner', { vendorId: vendor.body.id, clientProvidedContract: true, note: 'Client supplied this contracted vendor for the finance sample.' }).expect(201)).body.id;
    }

    // Contracts: catering 400 plates x 2,500; DJ 1,20,000; decor/florist 3,00,000.
    const contract = { CATERING: 400 * 2500 * L, DJ_SOUND: 120000 * L, DECOR: 300000 * L };
    for (const [code, paise] of Object.entries(contract)) await api('post', `/weddings/${id}/vendor-contracts`, 'finance', { weddingVendorId: wv[code], amount: rupees(paise), note: 'Signed client vendor contract reviewed by finance.' }).expect(201);
    await api('post', `/weddings/${id}/vendor-contracts`, 'finance', { weddingVendorId: wv.CATERING, amount: '1.00', note: 'Attempted overwrite of approved contract.' }).expect(409);

    const settings = { estimatedRevenue: '2600000.00', contractedRevenue: '2500000.00', estimatedVendorCost: '1420000.00', estimatedLabourCost: '60000.00', estimatedOtherDirectCost: '25000.00', recognitionPolicy: 'Recognize revenue per function once the founder confirms the function was delivered.' };
    await api('post', `/weddings/${id}/finance-settings`, 'finance', settings).expect(403);
    await api('post', `/weddings/${id}/finance-settings`, 'founder', settings).expect(201);
    await api('post', `/weddings/${id}/finance-settings`, 'founder', settings).expect(409);

    // Extras for 60 additional guests, extra DJ hours and the florist generator.
    const extras = {
      guests: { kind: 'EXTRA_GUESTS', qty: 60, rate: 500 * L, tax: 12, client: 36000 * L, vendor: undefined },
      plates: { kind: 'EXTRA_PLATES', qty: 60, rate: 2500 * L, tax: 5, client: 165000 * L, vendor: wv.CATERING },
      dj: { kind: 'DJ_HOURS', qty: 2, rate: 15000 * L, tax: 18, client: 40000 * L, vendor: wv.DJ_SOUND },
      generator: { kind: 'GENERATOR', qty: 1, rate: 18000 * L, tax: 18, client: 0, vendor: wv.DECOR },
    };
    const expenseIds: Record<string, string> = {};
    for (const [name, e] of Object.entries(extras)) {
      const r = await api('post', `/weddings/${id}/expenses`, 'coordinator', { ...(e.vendor ? { weddingVendorId: e.vendor } : {}), reference: `EXP-${name}`, kind: e.kind, description: `Sample ${name}`, quantity: String(e.qty), unitRate: rupees(e.rate), taxRate: String(e.tax), clientCharge: rupees(e.client) }).expect(201);
      const expected = line(e.qty, e.rate, e.tax);
      assert.equal(r.body.netAmount, rupees(expected.net)); assert.equal(r.body.taxAmount, rupees(expected.tax)); assert.equal(r.body.total, rupees(expected.total));
      expenseIds[name] = r.body.id;
    }
    await api('post', `/weddings/${id}/expenses`, 'coordinator', { reference: 'EXP-guests', kind: 'OTHER', description: 'Duplicate reference', quantity: '1', unitRate: '1.00', taxRate: '0', clientCharge: '0.00' }).expect(409);
    const rejected = await api('post', `/weddings/${id}/expenses`, 'coordinator', { weddingVendorId: wv.CATERING, reference: 'EXP-REJECTED', kind: 'OTHER', description: 'Unapproved dessert counter', quantity: '1', unitRate: '50000.00', taxRate: '5', clientCharge: '0.00' }).expect(201);
    await api('post', `/expenses/${rejected.body.id}/reject`, 'finance', { note: 'Not requested by the family in writing.' }).expect(201);

    // Client sees only chargeable lines without internal cost fields, and must accept before finance approval.
    const clientView = await api('get', `/weddings/${id}/expenses`, 'client').expect(200);
    assert.equal(clientView.body.total, 3);
    assert.ok(clientView.body.data.every((e: Record<string, unknown>) => !('unitRate' in e) && !('total' in e)));
    await api('post', `/expenses/${expenseIds.plates}/approve`, 'finance', { note: 'Caterer headcount sheet matched.' }).expect(409);
    await api('post', `/expenses/${expenseIds.generator}/client-approve`, 'client').expect(404);
    for (const name of ['guests', 'plates', 'dj']) await api('post', `/expenses/${expenseIds[name]}/client-approve`, 'client').expect(201);
    for (const name of Object.keys(extras)) await api('post', `/expenses/${expenseIds[name]}/approve`, 'finance', { note: 'Supporting headcount and vendor confirmation reviewed.' }).expect(201);
    await api('post', `/expenses/${expenseIds.dj}/approve`, 'finance', { note: 'Supporting headcount and vendor confirmation reviewed.' }).expect(409);

    const committed = { CATERING: contract.CATERING + line(60, 2500 * L, 5).total, DJ_SOUND: contract.DJ_SOUND + line(2, 15000 * L, 18).total, DECOR: contract.DECOR + line(1, 18000 * L, 18).total };
    assert.deepEqual(committed, { CATERING: 115750000, DJ_SOUND: 15540000, DECOR: 32124000 });

    // Vendor advances against committed cost (no bill yet).
    const advances = { CATERING: 500000 * L, DJ_SOUND: 60000 * L, DECOR: 150000 * L };
    for (const [code, paise] of Object.entries(advances)) await verify(await vendorPayment(id, wv[code]!, 'ADVANCE', rupees(paise))).expect(201);
    await verify(await vendorPayment(id, wv.DJ_SOUND!, 'FINAL', '1.00')).expect(409); // final needs verified bill

    // Final bills: one per vendor, must equal contract + approved extras.
    const billIds: Record<string, string> = {};
    for (const code of Object.keys(contract) as (keyof typeof contract)[]) billIds[code] = (await api('post', `/weddings/${id}/vendor-bills`, 'finance', { weddingVendorId: wv[code], reference: `INV-${randomUUID()}`, amount: rupees(code === 'CATERING' ? committed[code] + 50000 * L : committed[code]), dueAt: '2027-03-01T00:00:00Z' }).expect(201)).body.id;
    await api('post', `/weddings/${id}/vendor-bills`, 'finance', { weddingVendorId: wv.DJ_SOUND, reference: `INV-${randomUUID()}`, amount: '1.00', dueAt: '2027-03-01T00:00:00Z' }).expect(409);
    await api('post', `/vendor-bills/${billIds.CATERING}/verify`, 'finance', { verifiedEvidence: true, note }).expect(409); // includes unapproved dessert counter
    await api('patch', `/vendor-bills/${billIds.CATERING}`, 'finance', { reference: `INV-${randomUUID()}`, amount: rupees(committed.CATERING), dueAt: '2027-03-01T00:00:00Z' }).expect(200);
    for (const code of Object.keys(billIds)) await api('post', `/vendor-bills/${billIds[code]}/verify`, 'finance', { verifiedEvidence: true, note }).expect(201);
    await api('patch', `/vendor-bills/${billIds.DJ_SOUND}`, 'finance', { reference: `INV-${randomUUID()}`, amount: '1.00', dueAt: '2027-03-01T00:00:00Z' }).expect(409);

    const finals = { CATERING: 400000 * L, DJ_SOUND: committed.DJ_SOUND - advances.DJ_SOUND };
    for (const [code, paise] of Object.entries(finals)) await verify(await vendorPayment(id, wv[code]!, 'FINAL', rupees(paise))).expect(201);
    await verify(await vendorPayment(id, wv.DJ_SOUND!, 'FINAL', '0.01')).expect(409); // overpayment

    const remaining = { CATERING: committed.CATERING - advances.CATERING - finals.CATERING, DJ_SOUND: 0, DECOR: committed.DECOR - advances.DECOR };
    const recon = (await api('get', `/weddings/${id}/reconciliation`, 'finance').expect(200)).body as Record<string, string | null>[];
    for (const code of Object.keys(contract) as (keyof typeof contract)[]) {
      const row = recon.find(r => r.weddingVendorId === wv[code])!;
      assert.equal(row.originalQuotation, rupees(contract[code]));
      assert.equal(row.committedCost, rupees(committed[code]));
      assert.equal(row.verifiedBill, rupees(committed[code]));
      assert.equal(row.vendorAdvances, rupees(advances[code]));
      assert.equal(row.remainingPayable, rupees(remaining[code]));
    }
    await api('get', `/weddings/${id}/reconciliation`, 'client').expect(403);

    // Client receipts; failed and reversed receipts never count as cash.
    const clientExtras = extras.guests.client + extras.plates.client + extras.dj.client;
    const collectible = 2500000 * L + clientExtras;
    await api('post', `/weddings/${id}/payment-milestones`, 'finance', { milestone: 'ADVANCE', amount: '1250000.00', dueAt: '2027-01-01T00:00:00Z' }).expect(201);
    await api('post', `/weddings/${id}/payment-milestones`, 'finance', { milestone: 'FINAL', amount: rupees(collectible - 1250000 * L + 1), dueAt: '2027-02-10T00:00:00Z' }).expect(409);
    await api('post', `/weddings/${id}/payment-milestones`, 'finance', { milestone: 'FINAL', amount: rupees(collectible - 1250000 * L), dueAt: '2027-02-10T00:00:00Z' }).expect(201);
    const advance = await receipt(id, 'ADVANCE', '1250000.00');
    const [a, b] = await Promise.all([verify(advance), verify(advance)]);
    assert.deepEqual([a.status, b.status].sort(), [201, 409]);
    const verified = (a.status === 201 ? a : b).body;
    assert.equal(verified.verificationMethod, 'MANUAL_BANK_REVIEW'); assert.equal(verified.isDemo, true);
    await verify(await receipt(id, 'FINAL', '1000000.00')).expect(201);
    await api('post', `/payments/${await receipt(id, 'FINAL', '5000.00')}/fail`, 'finance', { note: 'Bank returned the transfer as failed.' }).expect(201);
    const reversed = await receipt(id, 'FINAL', '7000.00');
    await verify(reversed).expect(201);
    await api('post', `/payments/${reversed}/reverse`, 'finance', { note: 'Chargeback received from the bank.' }).expect(201);
    await api('post', `/payments/${reversed}/reverse`, 'finance', { note: 'Chargeback received from the bank.' }).expect(409);
    await api('post', `/payments/${advance}/verify`, 'client', { verifiedEvidence: true, note }).expect(403);
    await api('get', `/weddings/${id}/payments?direction=VENDOR_DISBURSEMENT`, 'client').expect(403);

    const cash = 1250000 * L + 1000000 * L;
    const balance = (await api('get', `/weddings/${id}/client-balance`, 'client').expect(200)).body;
    assert.equal(balance.approvedClientCharges, rupees(clientExtras));
    assert.equal(balance.collectible, rupees(collectible));
    assert.equal(balance.cashCollected, rupees(cash));
    assert.equal(balance.outstandingReceivable, rupees(collectible - cash));
    assert.equal(balance.unallocatedReceivable, '0.00');

    // Team labour at founder-approved rates only.
    const planRate = (await api('post', '/labour-rates', 'founder', { userId: users.planner, hourlyRate: '1500.00', currency: 'INR', effectiveFrom: past(60 * 24 * 30) }).expect(201)).body.id;
    const coordRate = (await api('post', '/labour-rates', 'founder', { userId: users.coordinator, hourlyRate: '800.00', currency: 'INR', effectiveFrom: past(60 * 24 * 30) }).expect(201)).body.id;
    await api('post', '/labour-rates', 'finance', { userId: users.planner, hourlyRate: '1.00', currency: 'INR', effectiveFrom: past(60) }).expect(403);
    const l1 = await api('post', `/weddings/${id}/labour`, 'planner', { userId: users.planner, rateId: planRate, reference: 'LAB-P1', hours: '20', workedAt: past(120) }).expect(201);
    const l2 = await api('post', `/weddings/${id}/labour`, 'coordinator', { userId: users.coordinator, rateId: coordRate, reference: 'LAB-C1', hours: '12.5', workedAt: past(120) }).expect(201);
    const l3 = await api('post', `/weddings/${id}/labour`, 'coordinator', { userId: users.coordinator, rateId: coordRate, reference: 'LAB-C2', hours: '4', workedAt: past(120) }).expect(201);
    await api('post', `/weddings/${id}/labour`, 'coordinator', { userId: users.planner, rateId: planRate, reference: 'LAB-X', hours: '1', workedAt: past(120) }).expect(403);
    assert.equal(l2.body.cost, '10000.00');
    for (const l of [l1, l2]) await api('post', `/labour/${l.body.id}/approve`, 'finance', { note: 'Timesheet matched the run sheet.' }).expect(201);
    await api('post', `/labour/${l3.body.id}/reject`, 'finance', { note: 'Duplicate of the earlier timesheet.' }).expect(201);
    const labour = 20 * 1500 * L + 12.5 * 800 * L;

    // Revenue recognition is explicit; reversed postings do not count.
    await api('post', `/weddings/${id}/revenue-recognitions`, 'finance', { reference: 'REV-SANGEET', amount: '2000000.00', recognizedAt: past(30), note: 'Sangeet and wedding functions delivered.' }).expect(201);
    const wrong = await api('post', `/weddings/${id}/revenue-recognitions`, 'finance', { reference: 'REV-WRONG', amount: '100000.00', recognizedAt: past(30), note: 'Posted to the wrong wedding by mistake.' }).expect(201);
    await api('post', `/revenue-recognitions/${wrong.body.id}/reverse`, 'finance', { note: 'Posted to the wrong wedding by mistake.' }).expect(201);
    await api('post', `/weddings/${id}/revenue-recognitions`, 'finance', { reference: 'REV-RECEPTION', amount: rupees(collectible - 2000000 * L), recognizedAt: past(10), note: 'Reception and approved extras delivered.' }).expect(201);
    await api('post', `/weddings/${id}/revenue-recognitions`, 'finance', { reference: 'REV-OVER', amount: '0.01', recognizedAt: past(5), note: 'Attempt to exceed the contract total.' }).expect(409);

    const vendorActual = committed.CATERING + committed.DJ_SOUND + committed.DECOR;
    const direct = line(60, 500 * L, 12).total;
    const actual = vendorActual + labour + direct;
    const estimated = (1420000 + 60000 + 25000) * L;
    const p = (await api('get', `/weddings/${id}/profitability`, 'finance').expect(200)).body;
    assert.deepEqual(
      { recognized: p.recognizedRevenue, contracted: p.contractedRevenue, cash: p.cashCollected, committed: p.committedVendorCosts, vendor: p.actualVendorCosts, labour: p.approvedLabourCosts, direct: p.approvedOtherDirectCosts, receivable: p.outstandingReceivables, payable: p.outstandingPayables, profit: p.operationalProfit, actual: p.actualTotalCosts, variance: p.costVariance },
      { recognized: rupees(collectible), contracted: '2500000.00', cash: rupees(cash), committed: rupees(vendorActual), vendor: rupees(vendorActual), labour: rupees(labour), direct: rupees(direct), receivable: rupees(collectible - cash), payable: rupees(remaining.CATERING + remaining.DECOR), profit: rupees(collectible - actual), actual: rupees(actual), variance: rupees(actual - estimated) });
    assert.equal(p.operationalProfit, '1033260.00');
    assert.deepEqual(p.warnings, []);

    const dash = (await api('get', `/reports/founder-dashboard?weddingId=${id}&from=2027-02-01&to=2027-02-28`, 'founder').expect(200)).body;
    assert.equal(dash.total, 1);
    assert.equal(dash.totalsByCurrency[0].operationalProfit, '1033260.00');
    assert.deepEqual(dash.upcomingDues.map((d: { amount: string }) => d.amount).sort(), [rupees(collectible - cash), rupees(remaining.CATERING), rupees(remaining.DECOR)].sort());
    assert.equal(dash.teamHours.reduce((s: number, t: { approvedHours: string }) => s + Number(t.approvedHours), 0), 32.5);
    assert.equal(dash.vendorPerformance.length, 3);
    assert.equal((await api('get', `/reports/founder-dashboard?weddingId=${id}&from=2027-03-01`, 'founder').expect(200)).body.total, 0);
    await api('get', '/reports/founder-dashboard', 'finance').expect(403);

    const actions = (await owner.auditLog.findMany({ where: { weddingId: id }, select: { action: true } })).map(r => r.action);
    for (const action of ['FINANCE_POLICY_APPROVED', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'VENDOR_BILL_VERIFIED', 'PAYMENT_VERIFIED', 'PAYMENT_REVERSED', 'PAYMENT_FAILED', 'REVENUE_REVERSED', 'LABOUR_APPROVED']) assert.ok(actions.includes(action), action);
  });
});
