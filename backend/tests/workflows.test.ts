import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/application.js';
import type { DocumentStore } from '../src/storage.js';

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
const app = createApp(db, { async verify(token) { return ids[token as keyof typeof ids] ?? null; }, async invite() { return randomUUID(); }, async signIn() { return null; }, async refresh() { return null; }, async signOut() {} }, { allowedOrigins: ['https://workflow.fixture'], documents: store });
function api(method: 'get' | 'post' | 'patch' | 'delete', path: string, actor = 'planner', body?: object, key = randomUUID()) {
  const req = request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${actor}`);
  if (method !== 'get') req.set('Idempotency-Key', key);
  return body ? req.send(body) : req;
}
let clientId: string;
async function wedding(packageType: 'FULL_SERVICE' | 'PARTIAL_DAY_OF' = 'FULL_SERVICE', weddingDate: string | null = '2027-12-20') {
  const created = await api('post', '/weddings', 'planner', { clientIds: [clientId], wedding: { title: `Workflow ${randomUUID()}`, packageType, weddingDate, coupleDetails: 'Aanya and Arjun', location: 'Jaipur', guestCount: 400, budgetMax: '1000000.00', requirements: 'Vegetarian menu and step-free access' } }).expect(201);
  for (const actor of ['finance', 'coordinator'] as const) await api('post', `/weddings/${created.body.id}/assignments`, 'founder', { userId: ids[actor] }).expect(201);
  return created.body.id as string;
}
const pdf = Buffer.from('%PDF-1.7\nSigned evidence fixture\n%%EOF');
async function document(weddingId: string, kind: 'AGREEMENT' | 'SIGNED_AGREEMENT' | 'FLOOR_PLAN' | 'PAYMENT_EVIDENCE', actor = 'planner') {
  const row = await api('post', `/weddings/${weddingId}/documents`, actor, { kind, fileName: 'reference.pdf', contentType: 'application/pdf', size: pdf.length }).expect(201);
  const lease = await api('post', `/documents/${row.body.id}/upload-url`, actor).expect(201);
  objects.set(lease.body.path, { bytes: pdf, contentType: 'application/pdf' });
  const completed = await api('post', `/documents/${row.body.id}/complete`, actor).expect(201);
  assert.equal(completed.body.status, 'VERIFIED');
  assert.match(completed.body.sha256, /^[0-9a-f]{64}$/);
  return completed.body.id as string;
}
async function signedAgreement(weddingId: string) {
  const source = await document(weddingId, 'AGREEMENT');
  const agreement = await api('post', `/weddings/${weddingId}/agreement`, 'planner', { title: 'Service agreement', terms: 'Client-approved wedding planning scope', documentId: source }).expect(201);
  await api('post', `/agreements/${agreement.body.id}/send`).expect(201);
  const signature = await document(weddingId, 'SIGNED_AGREEMENT', 'client');
  await api('post', `/agreements/${agreement.body.id}/submit-signature`, 'client', { documentId: signature, claimedSignedAt: new Date().toISOString() }).expect(201);
  await api('post', `/agreements/${agreement.body.id}/verify`, 'planner', { verifiedEvidence: true, signedAt: new Date().toISOString(), note: 'Reviewed the uploaded signed document against the service scope.' }).expect(201);
  return agreement.body.id as string;
}
async function vendor(categoryCode = 'CATERING') {
  return (await api('post', '/vendors', 'planner', { name: `Vendor ${randomUUID()}`, categoryCode, contactName: 'Vendor Manager', email: `${randomUUID()}@workflow.invalid`, phone: '+91 9876543210', serviceDetails: 'Wedding service with agreed staffing' }).expect(201)).body.id as string;
}
const quoteBody = { pricePerPlate: '100.10', guestCount: 400, additionalHourRate: '10.01', additionalHours: '1.50', menuDetails: 'Vegetarian regional menu', inclusions: ['Staffing'], exclusions: ['Venue rental'], items: [{ description: 'Equipment', quantity: '2.5', unitPrice: '3.33' }] };
async function round(weddingId: string) {
  const vendorIds = await Promise.all([vendor(), vendor(), vendor()]);
  return (await api('post', `/weddings/${weddingId}/quotation-rounds`, 'planner', { categoryCode: 'CATERING', vendorIds }).expect(201)).body;
}
async function claim(weddingId: string, amount = '100.00', actor = 'client') {
  return (await api('post', `/weddings/${weddingId}/booking-payments`, actor, { amount, reference: `bank-${randomUUID()}` }).expect(201)).body.id as string;
}
async function verify(paymentId: string) { return api('post', `/booking-payments/${paymentId}/verify`, 'finance', { verifiedEvidence: true, note: 'Bank reference and received amount independently verified.' }).expect(201); }
async function confirm(weddingId: string, amount = '100.00') { return api('post', `/weddings/${weddingId}/confirm-proposal`, 'planner', { bookingDepositRequired: amount }).expect(201); }

before(async () => {
  for (const [actor, id] of Object.entries(ids)) await owner.userProfile.create({ data: { id, displayName: actor, email: `${actor}@workflow.invalid`, role: actor === 'founder' ? 'FOUNDER' : actor === 'finance' ? 'FINANCE' : actor === 'coordinator' ? 'COORDINATOR' : actor === 'client' ? 'CLIENT' : 'PLANNER' } });
  const contact = await api('post', '/clients', 'founder', { name: 'Wedding clients', email: 'client@workflow.invalid', phone: '+91 9999999999', requirements: 'Step-free access' }).expect(201);
  clientId = contact.body.id;
  await owner.client.update({ where: { id: clientId }, data: { userId: ids.client } });
});
after(async () => { await db.$disconnect(); await owner.$disconnect(); });

describe('Phase 2 enquiries and client context', () => {
  it('creates complete enquiry context without duplicating client or wedding identities', async () => {
    const before = await owner.client.count();
    const row = await api('post', '/enquiries', 'planner', { clientIds: [clientId], source: 'PHONE', wedding: { title: 'New couple enquiry', coupleDetails: 'Aanya and Arjun', packageType: 'FULL_SERVICE', weddingDate: '2027-11-10', location: 'Udaipur', guestCount: 400, budgetMax: '123456.78', preferredTheme: 'Heritage', requirements: 'Vegetarian menu' } }).expect(201);
    assert.equal(row.body.wedding.location, 'Udaipur');
    assert.equal(row.body.enquiry.assignedToId, ids.planner);
    assert.equal(await owner.client.count(), before);
    assert.notEqual(row.body.wedding.id, row.body.enquiry.id);
    await api('patch', `/enquiries/${row.body.enquiry.id}`, 'planner', { followUpStatus: 'FOLLOW_UP_DUE', followUpAt: '2027-01-10T10:00:00.000Z' }).expect(200);
    const filtered = await api('get', `/enquiries?source=PHONE&followUpStatus=FOLLOW_UP_DUE&assignedToId=${ids.planner}&q=New%20couple`, 'planner').expect(200);
    assert.ok(filtered.body.data.some((entry: { id: string }) => entry.id === row.body.enquiry.id));
    await api('get', '/enquiries?followUpStatus=FOLLOW_UP_DUE', 'client').expect(403);
    const reassigned = await api('post', `/enquiries/${row.body.enquiry.id}/assignment`, 'founder', { userId: ids.outsider }).expect(201);
    assert.equal(reassigned.body.assignedToId, ids.outsider);
    await api('get', `/enquiries/${row.body.enquiry.id}`, 'outsider').expect(200);
    const history = await api('get', `/clients/${clientId}/activity`, 'planner').expect(200);
    assert.ok(history.body.data.length > 0);
    assert.ok(history.body.data.every((entry: object) => !('details' in entry)));
    await api('get', `/clients/${clientId}/consultations`, 'planner').expect(200);
    await api('get', `/clients/${clientId}/activity`, 'client').expect(403);
  });
});

describe('Phase 2 agreement evidence and private sharing gate', () => {
  it('keeps vendor lists and floor plans locked until authorized signature review', async () => {
    const id = await wedding();
    const floor = await document(id, 'FLOOR_PLAN');
    await api('get', `/weddings/${id}/vendors`, 'client').expect(403);
    await api('get', `/weddings/${id}/floor-plans`, 'client').expect(403);
    await api('post', `/documents/${floor}/download-url`, 'client').expect(403);
    const source = await document(id, 'AGREEMENT');
    const agreement = await api('post', `/weddings/${id}/agreement`, 'planner', { title: 'Services', terms: 'Approved scope', documentId: source }).expect(201);
    await api('get', `/weddings/${id}/agreement`, 'client').expect(404);
    await api('post', `/agreements/${agreement.body.id}/send`).expect(201);
    await api('get', `/weddings/${id}/agreement`, 'client').expect(200);
    const signature = await document(id, 'SIGNED_AGREEMENT', 'client');
    const submitted = await api('post', `/agreements/${agreement.body.id}/submit-signature`, 'client', { documentId: signature, claimedSignedAt: new Date().toISOString() }).expect(201);
    assert.equal(submitted.body.status, 'SIGNATURE_SUBMITTED');
    assert.equal(submitted.body.signedAt, null);
    await api('get', `/weddings/${id}/vendors`, 'client').expect(403);
    const review = { verifiedEvidence: true, signedAt: new Date().toISOString(), note: 'Manually reviewed signed pages and client identity evidence.' };
    await api('post', `/agreements/${agreement.body.id}/verify`, 'client', review).expect(403);
    await api('post', `/agreements/${agreement.body.id}/verify`, 'finance', review).expect(403);
    await api('post', `/agreements/${agreement.body.id}/verify`, 'outsider', review).expect(404);
    await api('post', `/agreements/${agreement.body.id}/verify`, 'planner', { ...review, verifiedEvidence: false }).expect(400);
    const verified = await api('post', `/agreements/${agreement.body.id}/verify`, 'planner', review).expect(201);
    assert.equal(verified.body.status, 'SIGNED');
    await api('get', `/weddings/${id}/vendors`, 'client').expect(200);
    assert.equal((await api('get', `/weddings/${id}/floor-plans`, 'client').expect(200)).body.total, 1);
    const lease = await api('post', `/documents/${floor}/download-url`, 'client').expect(201);
    assert.equal(lease.body.expiresIn, 60);
    assert.equal(lease.headers['cache-control'], 'no-store');
    assert.equal(verified.body.reviewNote, undefined);
    const stored = await owner.agreement.findUniqueOrThrow({ where: { id: agreement.body.id } });
    assert.equal(stored.verifiedBy, ids.planner);
  });
  it('rejects false file metadata, cross-wedding evidence and modification of verified uploads', async () => {
    const first = await wedding(), second = await wedding();
    const registered = await api('post', `/weddings/${first}/documents`, 'planner', { kind: 'AGREEMENT', fileName: 'bad.pdf', contentType: 'application/pdf', size: 5 }).expect(201);
    const lease = await api('post', `/documents/${registered.body.id}/upload-url`).expect(201);
    objects.set(lease.body.path, { bytes: Buffer.from('wrong'), contentType: 'application/pdf' });
    await api('post', `/documents/${registered.body.id}/complete`).expect(400);
    assert.equal((await owner.document.findUniqueOrThrow({ where: { id: registered.body.id } })).status, 'PENDING');
    const source = await document(first, 'AGREEMENT');
    await api('post', `/weddings/${second}/agreement`, 'planner', { title: 'Wrong wedding', terms: 'Scope', documentId: source }).expect(400);
    await api('post', `/documents/${source}/upload-url`).expect(409);
    await api('post', `/documents/${source}/download-url`, 'outsider').expect(404);
    await api('post', `/weddings/${first}/documents`, 'client', { kind: 'FLOOR_PLAN', fileName: 'plan.pdf', contentType: 'application/pdf', size: pdf.length }).expect(403);
    await api('post', `/weddings/${first}/documents`, 'planner', { kind: 'AGREEMENT', fileName: '../escape.pdf', contentType: 'application/pdf', size: 5 }).expect(400);
  });
  it('supports rejection and resubmission without falsely marking a document signed', async () => {
    const id = await wedding();
    const source = await document(id, 'AGREEMENT');
    const agreement = await api('post', `/weddings/${id}/agreement`, 'planner', { title: 'Service', terms: 'Scope', documentId: source }).expect(201);
    await api('post', `/agreements/${agreement.body.id}/send`).expect(201);
    const evidence = await document(id, 'SIGNED_AGREEMENT', 'client');
    await api('post', `/agreements/${agreement.body.id}/submit-signature`, 'client', { documentId: evidence, claimedSignedAt: new Date().toISOString() }).expect(201);
    const rejected = await api('post', `/agreements/${agreement.body.id}/reject-signature`, 'planner', { note: 'The uploaded signature pages are incomplete.' }).expect(201);
    assert.equal(rejected.body.status, 'SENT');
    assert.equal(rejected.body.signedAt, null);
    await api('get', `/weddings/${id}/floor-plans`, 'client').expect(403);
  });
});

describe('Phase 2 vendor and quotation workflows', () => {
  it('supports authorized vendor CRUD, categories and normalized duplicate prevention', async () => {
    const categories = await api('get', '/vendor-categories').expect(200);
    assert.equal(categories.body.length, 18);
    const id = await vendor('OTHER');
    await api('get', `/vendors/${id}`).expect(200);
    await api('patch', `/vendors/${id}`, 'planner', { serviceDetails: 'Updated wedding service scope' }).expect(200);
    await api('patch', `/vendors/${id}`, 'client', { name: 'Takeover' }).expect(403);
    const record = await owner.vendor.findUniqueOrThrow({ where: { id } });
    await api('post', '/vendors', 'planner', { name: record.name, categoryCode: record.categoryCode, contactName: record.contactName, email: record.email.toUpperCase(), phone: record.phone, serviceDetails: record.serviceDetails }).expect(409);
    await api('delete', `/vendors/${id}`, 'founder').expect(200);
    await api('get', `/vendors/${id}`).expect(404);
    await api('get', '/vendors', 'client').expect(403);
  });
  it('requires three distinct catering vendors and validates itemized totals on the backend', async () => {
    const id = await wedding();
    await api('post', `/weddings/${id}/quotation-rounds`, 'planner', { categoryCode: 'CATERING', vendorIds: [await vendor()] }).expect(400);
    const group = await round(id);
    const first = await api('post', `/quotation-requests/${group.requests[0].id}/quotation`, 'planner', quoteBody).expect(201);
    assert.equal(first.body.total, '40063.35');
    assert.equal(first.body.items[0].total, '8.33');
    await api('post', `/quotation-requests/${group.requests[1].id}/quotation`, 'planner', { ...quoteBody, total: '1.00' }).expect(400);
    await api('post', `/quotation-requests/${group.requests[1].id}/quotation`, 'planner', { ...quoteBody, pricePerPlate: '-1' }).expect(400);
    await api('post', `/quotations/${first.body.id}/select`).expect(409);
    await api('get', `/quotation-rounds/${group.id}/comparison`, 'outsider').expect(404);
    await api('get', `/quotation-rounds/${group.id}/comparison`, 'client').expect(403);
    await api('post', `/quotations/${first.body.id}/select`, 'finance').expect(403);
  });
  it('selects one winner under concurrency, closes both losers and protects repeat attempts', async () => {
    const id = await wedding();
    await signedAgreement(id);
    const group = await round(id);
    const quotes = [];
    for (const entry of group.requests) quotes.push((await api('post', `/quotation-requests/${entry.id}/quotation`, 'planner', quoteBody).expect(201)).body);
    const comparison = await api('get', `/quotation-rounds/${group.id}/comparison`).expect(200);
    assert.equal(comparison.body.requests.length, 3);
    assert.equal(comparison.body.currency, 'INR');
    const keys = [randomUUID(), randomUUID()];
    const decisions = await Promise.all([api('post', `/quotations/${quotes[0].id}/select`, 'planner', undefined, keys[0]), api('post', `/quotations/${quotes[1].id}/select`, 'planner', undefined, keys[1])]);
    assert.deepEqual(decisions.map(row => row.status).sort(), [201, 409]);
    const winnerIndex = decisions.findIndex(row => row.status === 201);
    const winning = decisions[winnerIndex]!;
    const replay = await api('post', `/quotations/${quotes[winnerIndex].id}/select`, 'planner', undefined, keys[winnerIndex]).expect(201);
    assert.deepEqual(replay.body, winning.body);
    await api('post', `/quotations/${quotes[winnerIndex].id}/select`).expect(409);
    const after = await api('get', `/quotation-rounds/${group.id}/comparison`).expect(200);
    assert.equal(after.body.requests.filter((entry: { status: string }) => entry.status === 'SELECTED').length, 1);
    assert.equal(after.body.requests.filter((entry: { status: string }) => entry.status === 'CLOSED').length, 2);
    assert.ok(after.body.requests.filter((entry: { status: string }) => entry.status === 'CLOSED').every((entry: { closedAt: string }) => entry.closedAt));
    assert.equal(await owner.weddingVendor.count({ where: { weddingId: id } }), 1);
    await api('patch', `/quotations/${quotes[0].id}`, 'planner', quoteBody).expect(409);
    const visible = await api('get', `/weddings/${id}/vendors`, 'client').expect(200);
    assert.equal(visible.body.total, 1);
    assert.equal(visible.body.data[0].quotationId, undefined);
    assert.equal(visible.body.data[0].total, undefined);
  });
  it('uses configured currency and locks it after procurement starts', async () => {
    const id = await wedding();
    await api('patch', `/weddings/${id}`, 'planner', { currency: 'USD' }).expect(200);
    const group = await round(id);
    assert.equal(group.currency, 'USD');
    await api('patch', `/weddings/${id}`, 'planner', { currency: 'INR' }).expect(409);
  });
});

describe('Phase 3 proposal, verified deposits and package task automation', () => {
  it('rejects an unconfirmed proposal even when a deposit was verified first', async () => {
    const id = await wedding();
    const paid = await verify(await claim(id));
    assert.equal(paid.body.taskGeneration, null);
    const missing = await api('post', `/weddings/${id}/tasks/generate`).expect(409);
    assert.equal(missing.body.error.code, 'PROPOSAL_UNCONFIRMED');
    const confirmed = await confirm(id);
    assert.ok(confirmed.body.taskGeneration.taskCount >= 25);
  });
  it('does not treat client claims as verified payments and rejects unauthorized verification', async () => {
    const id = await wedding();
    await confirm(id);
    const payment = await claim(id, '1000.00');
    const denied = await api('post', `/weddings/${id}/tasks/generate`).expect(409);
    assert.equal(denied.body.error.code, 'DEPOSIT_UNVERIFIED');
    const body = { verifiedEvidence: true, note: 'Manually reviewed the bank reference and amount.' };
    for (const actor of ['client', 'planner', 'coordinator']) await api('post', `/booking-payments/${payment}/verify`, actor, body).expect(403);
    await api('post', `/booking-payments/${payment}/verify`, 'outsider', body).expect(403);
    await api('post', `/booking-payments/${payment}/verify`, 'finance', { ...body, verifiedEvidence: false }).expect(400);
    assert.equal((await owner.bookingPayment.findUniqueOrThrow({ where: { id: payment } })).status, 'CLAIMED');
  });
  it('generates at least 25 relevant tasks for each package and records the template version', async () => {
    for (const packageType of ['FULL_SERVICE', 'PARTIAL_DAY_OF'] as const) {
      const id = await wedding(packageType);
      await confirm(id);
      const result = await verify(await claim(id));
      const generation = result.body.taskGeneration;
      assert.equal(generation.taskCount, packageType === 'FULL_SERVICE' ? 35 : 30);
      assert.equal(generation.templateVersion, packageType === 'FULL_SERVICE' ? 'full-service.v1' : 'partial-day-of.v1');
      const tasks = await api('get', `/weddings/${id}/tasks?pageSize=100`).expect(200);
      assert.equal(tasks.body.data.length, generation.taskCount);
      assert.ok(tasks.body.data.every((task: { ownerId: string; status: string }) => task.ownerId === ids.planner && task.status === 'TO_PLAN'));
      if (packageType === 'PARTIAL_DAY_OF') assert.ok(tasks.body.data.every((task: { category: string; templateKey: string }) => task.category !== 'DESIGN' && !['venue-shortlist', 'venue-confirm'].includes(task.templateKey)));
      assert.equal(await owner.weddingFunction.count({ where: { weddingId: id } }), 3);
      assert.equal((await owner.wedding.findUniqueOrThrow({ where: { id } })).state, 'PLANNING');
      await api('patch', `/weddings/${id}`, 'planner', { packageType: packageType === 'FULL_SERVICE' ? 'PARTIAL_DAY_OF' : 'FULL_SERVICE' }).expect(409);
    }
  });
  it('requires the complete verified deposit amount and ignores unverified excess claims', async () => {
    const id = await wedding();
    await confirm(id, '100.00');
    assert.equal((await verify(await claim(id, '40.00'))).body.taskGeneration, null);
    await claim(id, '10000.00');
    await api('post', `/weddings/${id}/tasks/generate`).expect(409);
    const final = await verify(await claim(id, '60.00'));
    assert.equal(final.body.taskGeneration.taskCount, 35);
  });
  it('serializes concurrent verified-payment triggers and repeated generation requests', async () => {
    const id = await wedding();
    await confirm(id);
    const payments = [await claim(id, '40.00'), await claim(id, '60.00')];
    const results = await Promise.all(payments.map(verify));
    assert.equal(results.filter(row => row.body.taskGeneration).length, 1);
    const generated = await Promise.all([api('post', `/weddings/${id}/tasks/generate`), api('post', `/weddings/${id}/tasks/generate`), api('post', `/weddings/${id}/tasks/generate`)]);
    assert.ok(generated.every(row => row.status === 201));
    assert.equal(new Set(generated.map(row => row.body.id)).size, 1);
    assert.equal(await owner.taskGeneration.count({ where: { weddingId: id } }), 1);
    assert.equal(await owner.weddingTask.count({ where: { weddingId: id } }), 35);
    await api('post', `/booking-payments/${payments[0]}/verify`, 'finance', { verifiedEvidence: true, note: 'Bank reference and received amount independently verified.' }).expect(409);
  });
  it('defers task deadlines for an unknown wedding date and generates when the date is supplied', async () => {
    const id = await wedding('FULL_SERVICE', null);
    await confirm(id);
    const verified = await verify(await claim(id));
    assert.equal(verified.body.payment.status, 'VERIFIED');
    assert.equal(verified.body.taskGeneration, null);
    await api('post', `/weddings/${id}/tasks/generate`).expect(409);
    const updated = await api('patch', `/weddings/${id}`, 'planner', { weddingDate: '2027-12-20' }).expect(200);
    assert.equal(updated.body.state, 'PLANNING');
    assert.equal(await owner.weddingTask.count({ where: { weddingId: id } }), 35);
  });
  it('supports task reassignment, deadlines, filtering and completion while enforcing ownership', async () => {
    const id = await wedding();
    await confirm(id); await verify(await claim(id));
    const tasks = await api('get', `/weddings/${id}/tasks`).expect(200);
    const taskId = tasks.body.data[0].id;
    await api('patch', `/tasks/${taskId}`, 'coordinator', { status: 'IN_PROGRESS' }).expect(403);
    await api('patch', `/tasks/${taskId}`, 'planner', { ownerId: ids.coordinator, deadline: '2027-12-01T10:00:00.000Z', priority: 'HIGH' }).expect(200);
    await api('patch', `/tasks/${taskId}`, 'coordinator', { deadline: '2027-12-02T10:00:00.000Z' }).expect(403);
    await api('patch', `/tasks/${taskId}`, 'coordinator', { status: 'IN_PROGRESS' }).expect(200);
    const done = await api('patch', `/tasks/${taskId}`, 'coordinator', { status: 'DONE' }).expect(200);
    assert.ok(done.body.completedAt);
    assert.equal((await api('patch', `/tasks/${taskId}`, 'coordinator', { status: 'BLOCKED' }).expect(200)).body.completedAt, null);
    const filtered = await api('get', `/weddings/${id}/tasks?ownerId=${ids.coordinator}&status=BLOCKED&priority=HIGH`).expect(200);
    assert.equal(filtered.body.total, 1);
    await api('patch', `/tasks/${taskId}`, 'planner', { ownerId: ids.outsider }).expect(400);
    await api('patch', `/tasks/${taskId}`, 'finance', { status: 'DONE' }).expect(403);
    await api('get', `/tasks/${taskId}`, 'outsider').expect(404);
    await api('get', `/weddings/${id}/tasks`, 'client').expect(403);
    await api('patch', `/tasks/${taskId}`, 'planner', { ownerId: ids.planner }).expect(200);
  });
  it('protects payment reference uniqueness, proposal confirmation and function ownership', async () => {
    const id = await wedding();
    const body = { amount: '100.00', reference: `bank-${randomUUID()}` };
    await api('post', `/weddings/${id}/booking-payments`, 'client', body).expect(201);
    await api('post', `/weddings/${id}/booking-payments`, 'client', { ...body, reference: body.reference.toUpperCase() }).expect(409);
    await confirm(id);
    await api('post', `/weddings/${id}/confirm-proposal`, 'planner', { bookingDepositRequired: '1.00' }).expect(409);
    await api('post', `/weddings/${id}/confirm-proposal`, 'client', { bookingDepositRequired: '100.00' }).expect(403);
    await verify(await claim(id));
    const task = (await api('get', `/weddings/${id}/tasks`).expect(200)).body.data[0];
    const other = await wedding();
    const otherFunction = await api('post', `/weddings/${other}/functions`, 'planner', { type: 'MEHENDI', name: 'Other Mehendi' }).expect(201);
    await api('patch', `/tasks/${task.id}`, 'planner', { functionId: otherFunction.body.id }).expect(400);
    const usedFunction = await owner.weddingFunction.findFirstOrThrow({ where: { weddingId: id } });
    await api('patch', `/functions/${usedFunction.id}`, 'planner', { type: usedFunction.type === 'MEHENDI' ? 'SANGEET' : 'MEHENDI', name: usedFunction.name }).expect(409);
    await api('post', `/weddings/${id}/functions`, 'client', { type: 'RECEPTION', name: 'Unauthorized' }).expect(403);
  });
});
