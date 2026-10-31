import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/application.js';
import type { DocumentStore } from '../src/storage.js';

// FICTIONAL demo data only: no real couple, vendor, bank or payment is represented.
assert.equal(process.env.ROYAL_KNOT_ISOLATED_TEST, 'true', 'Use the disposable PostgreSQL runner');
const db = new PrismaClient();
const owner = new PrismaClient({ datasources: { db: { url: process.env.TEST_ADMIN_URL! } } });
const ids = { founder: randomUUID(), planner: randomUUID(), finance: randomUUID(), coordinator: randomUUID(), client: randomUUID(), outsider: randomUUID() };
const objects = new Map<string, { bytes: Uint8Array; contentType: string }>();
const store: DocumentStore = {
  async uploadUrl(path) { return { path, token: 'fixture-upload-token', signedUrl: `https://storage.fixture/upload/${path}` }; },
  async read(path) { const value = objects.get(path); if (!value) throw new Error('Fixture object missing'); return value; },
  async downloadUrl(path) { return `https://storage.fixture/download/${path}`; },
};
const app = createApp(db, { async verify(token) { return ids[token as keyof typeof ids] ?? null; }, async invite() { return randomUUID(); }, async signIn() { return null; }, async refresh() { return null; }, async signOut() {} }, { allowedOrigins: [], documents: store });
function api(method: 'get' | 'post' | 'patch', path: string, actor = 'planner', body?: object, key = randomUUID()) { const req = request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${actor}`); if (method !== 'get') req.set('Idempotency-Key', key); return body ? req.send(body) : req; }
const pdf = Buffer.from('%PDF-1.7\nFictional evidence fixture\n%%EOF');
async function document(weddingId: string, kind: string, actor = 'planner') {
  const row = await api('post', `/weddings/${weddingId}/documents`, actor, { kind, fileName: 'fictional.pdf', contentType: 'application/pdf', size: pdf.length }).expect(201);
  const lease = await api('post', `/documents/${row.body.id}/upload-url`, actor).expect(201);
  objects.set(lease.body.path, { bytes: pdf, contentType: 'application/pdf' });
  return (await api('post', `/documents/${row.body.id}/complete`, actor).expect(201)).body.id as string;
}
const note = 'Fictional demo: bank statement line manually checked by finance.';
const past = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();
// Expected values are computed independently in integer paise, never read back from the API.
const L = 100;
const rupees = (paise: number) => `${Math.trunc(paise / 100)}.${String(paise % 100).padStart(2, '0')}`;
const line = (qty: number, ratePaise: number, taxPct: number) => { const net = qty * ratePaise; return net + Math.round(net * taxPct / 100); };
const step = (n: number, label: string) => process.stdout.write(`# E2E step ${n}: ${label}\n`);

before(async () => {
  for (const [actor, id] of Object.entries(ids)) await owner.userProfile.create({ data: { id, displayName: `Fictional ${actor}`, email: `${actor}@e2e.invalid`, role: actor === 'founder' ? 'FOUNDER' : actor === 'finance' ? 'FINANCE' : actor === 'coordinator' ? 'COORDINATOR' : actor === 'client' ? 'CLIENT' : 'PLANNER' } });
});
after(async () => { await db.$disconnect(); await owner.$disconnect(); });

describe('Phase 6 end-to-end: FICTIONAL three-day Udaipur wedding, 400 + 60 guests', () => {
  it('runs enquiry through founder dashboard with independently verified results', async () => {
    step(1, 'client enquiry');
    const clientId = (await api('post', '/clients', 'founder', { name: 'FICTIONAL Mehra-Rao family', email: 'family@e2e.invalid', phone: '+91 9000000000' }).expect(201)).body.id;
    await owner.client.update({ where: { id: clientId }, data: { userId: ids.client } });
    const enquiry = await api('post', '/enquiries', 'planner', { clientIds: [clientId], source: 'REFERRAL', wedding: { title: 'FICTIONAL Udaipur lakeside wedding (demo)', packageType: 'FULL_SERVICE', weddingDate: '2027-12-20', location: 'Udaipur, Rajasthan', coupleDetails: 'Fictional couple Isha and Kabir' } }).expect(201);
    const id = enquiry.body.wedding.id as string;
    for (const actor of ['finance', 'coordinator'] as const) await api('post', `/weddings/${id}/assignments`, 'founder', { userId: ids[actor] }).expect(201);
    await api('get', `/weddings/${id}`, 'outsider').expect(404);

    step(2, 'wedding requirements');
    const req = await api('patch', `/weddings/${id}`, 'planner', { guestCount: 400, requirements: 'Three days: Mehendi, Sangeet, Reception. Vegetarian menu, lakeside venue, step-free access.', preferredTheme: 'Rajasthani heritage' }).expect(200);
    assert.equal(req.body.guestCount, 400);

    step(3, 'agreement workflow');
    const source = await document(id, 'AGREEMENT');
    const agreement = await api('post', `/weddings/${id}/agreement`, 'planner', { title: 'FICTIONAL planning services agreement', terms: 'Full-service planning for three functions.', documentId: source }).expect(201);
    await api('post', `/agreements/${agreement.body.id}/send`).expect(201);
    const signed = await document(id, 'SIGNED_AGREEMENT', 'client');
    await api('post', `/agreements/${agreement.body.id}/submit-signature`, 'client', { documentId: signed, claimedSignedAt: past(5) }).expect(201);
    assert.equal((await api('post', `/agreements/${agreement.body.id}/verify`, 'planner', { verifiedEvidence: true, signedAt: past(5), note: 'Reviewed the fictional signed pages against scope.' }).expect(201)).body.status, 'SIGNED');

    step(4, 'three caterer quotations');
    const directory = async (code: string) => (await api('post', '/vendors', 'planner', { name: `FICTIONAL ${code} ${randomUUID().slice(0, 8)}`, categoryCode: code, contactName: 'Demo manager', email: `${randomUUID()}@e2e.invalid`, phone: '+91 9111111111', serviceDetails: 'Fictional demo vendor' }).expect(201)).body.id as string;
    const caterers = [await directory('CATERING'), await directory('CATERING'), await directory('CATERING')];
    const round = (await api('post', `/weddings/${id}/quotation-rounds`, 'planner', { categoryCode: 'CATERING', vendorIds: caterers }).expect(201)).body;
    const plate = [2500, 2650, 2400];
    const quotes = [];
    for (const [i, r] of round.requests.entries()) quotes.push((await api('post', `/quotation-requests/${r.id}/quotation`, 'planner', { pricePerPlate: `${plate[i]}.00`, guestCount: 400, additionalHourRate: '0.00', additionalHours: '0', menuDetails: `Fictional menu option ${i + 1}`, inclusions: ['Service staff'], exclusions: ['Alcohol'], items: [] }).expect(201)).body);
    assert.deepEqual(quotes.map(q => q.total), plate.map(p => rupees(p * 400 * L)));

    step(5, 'compare quotations');
    const comparison = await api('get', `/quotation-rounds/${round.id}/comparison`).expect(200);
    assert.equal(comparison.body.requests.length, 3);
    await api('get', `/quotation-rounds/${round.id}/comparison`, 'client').expect(403);

    step(6, 'select one caterer');
    const selection = await api('post', `/quotations/${quotes[0].id}/select`).expect(201);
    const after = await api('get', `/quotation-rounds/${round.id}/comparison`).expect(200);
    assert.deepEqual(after.body.requests.map((r: { status: string }) => r.status).sort(), ['CLOSED', 'CLOSED', 'SELECTED']);
    const wv: Record<string, string> = { CATERING: selection.body.id };
    const vendorIds: Record<string, string> = { CATERING: round.requests[0].vendorId };
    for (const code of ['DJ_SOUND', 'DECOR', 'PHOTOGRAPHY']) {
      vendorIds[code] = await directory(code);
      wv[code] = (await api('post', `/weddings/${id}/vendors/client-provided`, 'planner', { vendorId: vendorIds[code], clientProvidedContract: true, note: 'Fictional family-contracted vendor for the demo.' }).expect(201)).body.id;
    }

    step(7, 'confirm proposal');
    await api('post', `/weddings/${id}/confirm-proposal`, 'planner', { bookingDepositRequired: '500000.00' }).expect(201);

    step(8, 'verify booking deposit');
    const deposit = (await api('post', `/weddings/${id}/booking-payments`, 'client', { amount: '500000.00', reference: `FICTIONAL-UTR-${randomUUID()}`, isDemo: true }).expect(201)).body.id;
    await api('post', `/booking-payments/${deposit}/verify`, 'planner', { verifiedEvidence: true, note }).expect(403);
    const verified = await api('post', `/booking-payments/${deposit}/verify`, 'finance', { verifiedEvidence: true, note }).expect(201);

    step(9, 'planning tasks generated');
    assert.equal(verified.body.taskGeneration.taskCount, 35);
    assert.equal((await api('get', `/weddings/${id}/tasks?pageSize=100`).expect(200)).body.total, 35);

    step(10, 'plan Mehendi, Sangeet and Reception');
    const functions = (await api('get', `/weddings/${id}/functions`).expect(200)).body.data as { id: string; type: string; name: string }[];
    assert.deepEqual(functions.map(f => f.type).sort(), ['MEHENDI', 'RECEPTION', 'SANGEET']);
    const days: Record<string, [string, string]> = { MEHENDI: ['2027-12-18T15:00:00+05:30', '2027-12-18T20:00:00+05:30'], SANGEET: ['2027-12-19T18:00:00+05:30', '2027-12-19T23:00:00+05:30'], RECEPTION: ['2027-12-20T18:00:00+05:30', '2027-12-20T23:30:00+05:30'] };
    const fn: Record<string, string> = {};
    for (const f of functions) { await api('patch', `/functions/${f.id}`, 'planner', { type: f.type, name: f.name, startAt: days[f.type]![0], endAt: days[f.type]![1], venue: 'FICTIONAL lakeside palace, Udaipur' }).expect(200); fn[f.type] = f.id; }

    step(11, 'wedding timeline');
    const varmala = (await api('post', `/weddings/${id}/timeline`, 'planner', { title: 'Varmala', functionId: fn.RECEPTION, plannedStart: '2027-12-20T19:15:00+05:30', plannedEnd: '2027-12-20T19:30:00+05:30', ownerId: ids.coordinator, vendorIds: [vendorIds.DJ_SOUND, vendorIds.DECOR], dependsOnIds: [] }).expect(201)).body;
    const dinner = (await api('post', `/weddings/${id}/timeline`, 'planner', { title: 'Reception dinner', functionId: fn.RECEPTION, plannedStart: '2027-12-20T19:30:00+05:30', plannedEnd: '2027-12-20T21:00:00+05:30', vendorIds: [vendorIds.CATERING], dependsOnIds: [varmala.id] }).expect(201)).body;
    const mehendi = (await api('post', `/weddings/${id}/timeline`, 'planner', { title: 'Mehendi portraits', functionId: fn.MEHENDI, plannedStart: '2027-12-18T16:00:00+05:30', plannedEnd: '2027-12-18T17:00:00+05:30', vendorIds: [vendorIds.PHOTOGRAPHY], dependsOnIds: [] }).expect(201)).body;
    assert.equal(varmala.plannedStart, '2027-12-20T13:45:00.000Z');

    step(12, 'move Varmala 7:15 PM -> 7:40 PM');
    const timeline = await api('get', `/weddings/${id}/timeline`).expect(200);
    assert.equal(timeline.body.timezone, 'Asia/Kolkata');
    const change = await api('post', `/timeline-events/${varmala.id}/schedule-changes`, 'coordinator', { expectedScheduleVersion: timeline.body.scheduleVersion, proposedStart: '2027-12-20T19:40:00+05:30', proposedEnd: '2027-12-20T19:55:00+05:30', shiftDependents: true, reason: 'Fictional: baraat arrival running 25 minutes late.' }).expect(201);
    await api('post', `/timeline-events/${varmala.id}/schedule-changes`, 'coordinator', { expectedScheduleVersion: timeline.body.scheduleVersion - 1, proposedStart: '2027-12-20T19:45:00+05:30', proposedEnd: '2027-12-20T20:00:00+05:30', shiftDependents: true, reason: 'Stale version attempt.' }).expect(409);

    step(13, 'affected vendors');
    const affected = new Set(change.body.impacts.flatMap((i: { vendorIds: string[] }) => i.vendorIds));
    assert.deepEqual([...affected].sort(), [vendorIds.CATERING, vendorIds.DECOR, vendorIds.DJ_SOUND].sort());
    assert.ok(!affected.has(vendorIds.PHOTOGRAPHY));

    step(14, 'approve schedule change');
    await api('post', `/schedule-changes/${change.body.id}/approve`, 'coordinator', { note: 'Self approval attempt by requester.' }).expect(403);
    assert.equal((await api('post', `/schedule-changes/${change.body.id}/approve`, 'planner', { note: 'Planner reviewed impacts on DJ, florist and dinner.' }).expect(201)).body.status, 'APPROVED');

    step(15, 'publish updated schedule');
    await api('post', `/schedule-changes/${change.body.id}/publish`).expect(201);
    await api('post', `/schedule-changes/${change.body.id}/publish`).expect(409);
    const events = (await api('get', `/weddings/${id}/timeline`).expect(200)).body.data as { id: string; plannedStart: string }[];
    assert.equal(events.find(e => e.id === varmala.id)!.plannedStart, '2027-12-20T14:10:00.000Z');
    assert.equal(events.find(e => e.id === dinner.id)!.plannedStart, '2027-12-20T14:25:00.000Z');
    assert.equal(events.find(e => e.id === mehendi.id)!.plannedStart, mehendi.plannedStart);

    step(16, 'track acknowledgements');
    const notes = (await api('get', `/weddings/${id}/notifications?pageSize=100`).expect(200)).body.data as { id: string; vendorId: string | null; status: string }[];
    const vendorNotes = notes.filter(n => n.vendorId);
    assert.deepEqual(vendorNotes.map(n => n.vendorId).sort(), [...affected].sort());
    assert.ok(vendorNotes.every(n => n.status === 'SENT'));
    for (const n of vendorNotes) {
      const token = (await api('post', `/notifications/${n.id}/vendor-link`).expect(201)).body.token;
      const body = n.vendorId === vendorIds.DECOR ? { status: 'PROBLEM', problemDescription: 'Florist needs a generator for the revised lighting slot.' } : { status: 'ACKNOWLEDGED' };
      await request(app).post(`/api/v1/vendor-inbox/${token}/respond`).send(body).expect(200);
    }
    const tracked = (await api('get', `/weddings/${id}/notifications?pageSize=100`).expect(200)).body.data as { vendorId: string | null; status: string }[];
    assert.deepEqual(tracked.filter(n => n.vendorId).map(n => n.status).sort(), ['ACKNOWLEDGED', 'ACKNOWLEDGED', 'PROBLEM']);

    step(17, 'late DJ incident');
    const arrival = await api('post', `/weddings/${id}/vendor-arrivals`, 'planner', { vendorId: vendorIds.DJ_SOUND, functionId: fn.RECEPTION, expectedAt: past(40), coordinatorId: ids.coordinator }).expect(201);
    const checkedIn = await api('post', `/vendor-arrivals/${arrival.body.id}/check-in`, 'coordinator', { actualAt: past(5) }).expect(201);
    assert.equal(checkedIn.body.isLate, true); assert.equal(checkedIn.body.lateMinutes, 35);
    await api('post', `/weddings/${id}/incidents`, 'coordinator', { category: 'VENDOR_DELAY', severity: 'HIGH', description: 'Fictional DJ arrived 35 minutes late; sound check compressed.', ownerId: ids.coordinator }).expect(201);

    step(18, 'florist generator requirement');
    await api('post', `/weddings/${id}/incidents`, 'coordinator', { category: 'EQUIPMENT', severity: 'MEDIUM', description: 'Florist requires an additional generator for revised lighting.', ownerId: ids.coordinator }).expect(201);
    await api('get', `/weddings/${id}/incidents`, 'client').expect(403);

    step(19, 'additional guest expenses');
    // Contracts: caterer = selected quotation; family-contracted vendors approved manually by finance.
    const contract = { CATERING: 2500 * 400 * L, DJ_SOUND: 120000 * L, DECOR: 300000 * L, PHOTOGRAPHY: 150000 * L };
    for (const code of ['DJ_SOUND', 'DECOR', 'PHOTOGRAPHY'] as const) await api('post', `/weddings/${id}/vendor-contracts`, 'finance', { weddingVendorId: wv[code], amount: rupees(contract[code]), note: 'Fictional family-signed vendor contract reviewed.' }).expect(201);
    await api('post', `/weddings/${id}/vendor-contracts`, 'finance', { weddingVendorId: wv.CATERING, amount: '1.00', note: 'Attempt to override a selected quotation.' }).expect(409);
    await api('post', `/weddings/${id}/finance-settings`, 'founder', { estimatedRevenue: '2600000.00', contractedRevenue: '2500000.00', estimatedVendorCost: '1570000.00', estimatedLabourCost: '40000.00', estimatedOtherDirectCost: '25000.00', recognitionPolicy: 'Recognize revenue per function once the founder confirms delivery.' }).expect(201);
    const extras = [
      { ref: 'GUEST-HAMPERS', kind: 'EXTRA_GUESTS', qty: 60, rate: 500 * L, tax: 12, client: 36000 * L },
      { ref: 'EXTRA-PLATES', kind: 'EXTRA_PLATES', qty: 60, rate: 2500 * L, tax: 5, client: 165000 * L, vendor: 'CATERING' },
      { ref: 'DJ-HOURS', kind: 'DJ_HOURS', qty: 2, rate: 15000 * L, tax: 18, client: 40000 * L, vendor: 'DJ_SOUND' },
      { ref: 'GENERATOR', kind: 'GENERATOR', qty: 1, rate: 18000 * L, tax: 18, client: 0, vendor: 'DECOR' },
    ];
    const expense: Record<string, { id: string; client: number }> = {};
    for (const e of extras) {
      const r = await api('post', `/weddings/${id}/expenses`, 'coordinator', { ...(e.vendor ? { weddingVendorId: wv[e.vendor] } : {}), reference: e.ref, kind: e.kind, description: `Fictional ${e.ref.toLowerCase()} for 60 extra guests`, quantity: String(e.qty), unitRate: rupees(e.rate), taxRate: String(e.tax), clientCharge: rupees(e.client) }).expect(201);
      assert.equal(r.body.total, rupees(line(e.qty, e.rate, e.tax)));
      expense[e.ref] = { id: r.body.id, client: e.client };
    }

    step(20, 'approve additional costs');
    for (const e of Object.values(expense)) if (e.client) await api('post', `/expenses/${e.id}/client-approve`, 'client').expect(201);
    for (const e of Object.values(expense)) await api('post', `/expenses/${e.id}/approve`, 'finance', { note: 'Fictional headcount sheet and vendor note reviewed.' }).expect(201);

    step(21, 'reconcile final vendor bills');
    const committed = { CATERING: contract.CATERING + line(60, 2500 * L, 5), DJ_SOUND: contract.DJ_SOUND + line(2, 15000 * L, 18), DECOR: contract.DECOR + line(1, 18000 * L, 18), PHOTOGRAPHY: contract.PHOTOGRAPHY };
    const advances = { CATERING: 500000 * L, DJ_SOUND: 60000 * L, DECOR: 150000 * L, PHOTOGRAPHY: 150000 * L };
    const pay = async (code: string, milestone: string, amount: number) => {
      const p = await api('post', `/weddings/${id}/payments`, 'finance', { amount: rupees(amount), reference: `FICTIONAL-NEFT-${randomUUID()}`, direction: 'VENDOR_DISBURSEMENT', milestone, weddingVendorId: wv[code], isDemo: true }).expect(201);
      await api('post', `/payments/${p.body.id}/claim`, 'finance', {}).expect(201);
      return api('post', `/payments/${p.body.id}/verify`, 'finance', { verifiedEvidence: true, note });
    };
    for (const [code, amount] of Object.entries(advances)) (await pay(code, 'ADVANCE', amount)).status === 201 || assert.fail(`advance ${code}`);
    for (const code of Object.keys(committed) as (keyof typeof committed)[]) {
      const bill = await api('post', `/weddings/${id}/vendor-bills`, 'finance', { weddingVendorId: wv[code], reference: `FICTIONAL-INV-${randomUUID()}`, amount: rupees(committed[code]), dueAt: '2027-12-31T00:00:00Z' }).expect(201);
      await api('post', `/vendor-bills/${bill.body.id}/verify`, 'finance', { verifiedEvidence: true, note }).expect(201);
    }
    const finals = { CATERING: 400000 * L, DJ_SOUND: committed.DJ_SOUND - advances.DJ_SOUND };
    for (const [code, amount] of Object.entries(finals)) (await pay(code, 'FINAL', amount)).status === 201 || assert.fail(`final ${code}`);
    assert.equal((await pay('PHOTOGRAPHY', 'FINAL', 1)).status, 409);

    step(22, 'client balance');
    const clientExtras = 36000 * L + 165000 * L + 40000 * L;
    const collectible = 2500000 * L + clientExtras;
    await api('post', `/weddings/${id}/payment-milestones`, 'finance', { milestone: 'BOOKING', amount: '500000.00', dueAt: '2027-06-01T00:00:00Z' }).expect(201);
    await api('post', `/weddings/${id}/payment-milestones`, 'finance', { milestone: 'ADVANCE', amount: '1000000.00', dueAt: '2027-10-01T00:00:00Z' }).expect(201);
    await api('post', `/weddings/${id}/payment-milestones`, 'finance', { milestone: 'FINAL', amount: rupees(collectible - 1500000 * L), dueAt: '2027-12-15T00:00:00Z' }).expect(201);
    for (const [milestone, amount] of [['ADVANCE', 1000000 * L], ['FINAL', 750000 * L]] as const) {
      const p = await api('post', `/weddings/${id}/payments`, 'client', { amount: rupees(amount), reference: `FICTIONAL-UTR-${randomUUID()}`, direction: 'CLIENT_RECEIPT', milestone, isDemo: true }).expect(201);
      await api('post', `/payments/${p.body.id}/claim`, 'client', {}).expect(201);
      assert.equal((await api('post', `/payments/${p.body.id}/verify`, 'finance', { verifiedEvidence: true, note }).expect(201)).body.isDemo, true);
    }
    const cash = 500000 * L + 1000000 * L + 750000 * L;
    const balance = (await api('get', `/weddings/${id}/client-balance`, 'client').expect(200)).body;
    assert.deepEqual({ c: balance.collectible, cash: balance.cashCollected, out: balance.outstandingReceivable }, { c: rupees(collectible), cash: rupees(cash), out: rupees(collectible - cash) });
    assert.equal(balance.outstandingReceivable, '491000.00');

    step(23, 'vendor balances');
    const remaining = { CATERING: committed.CATERING - advances.CATERING - finals.CATERING, DJ_SOUND: 0, DECOR: committed.DECOR - advances.DECOR, PHOTOGRAPHY: 0 };
    const recon = (await api('get', `/weddings/${id}/reconciliation`, 'finance').expect(200)).body as { weddingVendorId: string; remainingPayable: string; originalQuotation: string }[];
    for (const code of Object.keys(remaining) as (keyof typeof remaining)[]) assert.equal(recon.find(r => r.weddingVendorId === wv[code])!.remainingPayable, rupees(remaining[code]), code);
    assert.equal(recon.find(r => r.weddingVendorId === wv.CATERING)!.originalQuotation, '1000000.00');

    step(24, 'profitability');
    const rate = (await api('post', '/labour-rates', 'founder', { userId: ids.planner, hourlyRate: '1500.00', currency: 'INR', effectiveFrom: past(60 * 24 * 60) }).expect(201)).body.id;
    const labourEntry = await api('post', `/weddings/${id}/labour`, 'planner', { userId: ids.planner, rateId: rate, reference: 'FICTIONAL-TIMESHEET-1', hours: '20', workedAt: past(60) }).expect(201);
    await api('post', `/labour/${labourEntry.body.id}/approve`, 'finance', { note: 'Fictional timesheet matched run sheet.' }).expect(201);
    await api('post', `/weddings/${id}/revenue-recognitions`, 'finance', { reference: 'FICTIONAL-REV-ALL', amount: rupees(collectible), recognizedAt: past(1), note: 'All three fictional functions delivered.' }).expect(201);
    const vendorCost = Object.values(committed).reduce((a, b) => a + b, 0);
    const labour = 20 * 1500 * L, direct = line(60, 500 * L, 12);
    const profit = collectible - vendorCost - labour - direct;
    const p = (await api('get', `/weddings/${id}/profitability`, 'finance').expect(200)).body;
    assert.deepEqual({ rev: p.recognizedRevenue, vendor: p.actualVendorCosts, labour: p.approvedLabourCosts, direct: p.approvedOtherDirectCosts, profit: p.operationalProfit, payables: p.outstandingPayables, warnings: p.warnings },
      { rev: rupees(collectible), vendor: rupees(vendorCost), labour: rupees(labour), direct: rupees(direct), profit: rupees(profit), payables: rupees(remaining.CATERING + remaining.DECOR), warnings: [] });
    assert.equal(p.operationalProfit, '893260.00');

    step(25, 'founder dashboard');
    const dash = (await api('get', `/reports/founder-dashboard?weddingId=${id}&from=2027-12-01&to=2027-12-31`, 'founder').expect(200)).body;
    assert.equal(dash.total, 1);
    assert.equal(dash.totalsByCurrency[0].operationalProfit, rupees(profit));
    assert.deepEqual(dash.upcomingDues.map((d: { amount: string }) => d.amount).sort(), [rupees(remaining.CATERING), rupees(remaining.DECOR), rupees(collectible - cash)].sort());
    const dj = dash.vendorPerformance.find((v: { vendorId: string }) => v.vendorId === vendorIds.DJ_SOUND);
    assert.deepEqual({ scheduled: dj.scheduledArrivals, late: dj.lateArrivals }, { scheduled: 1, late: 1 });
    await api('get', '/reports/founder-dashboard', 'planner').expect(403);
    assert.ok(await owner.auditLog.count({ where: { weddingId: id } }) > 50);
  });
});
