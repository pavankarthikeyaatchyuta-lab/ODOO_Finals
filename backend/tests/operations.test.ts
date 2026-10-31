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
function api(method: 'get' | 'post' | 'patch' | 'delete', path: string, actor = 'planner', body?: object, key = randomUUID()) { const req = request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${actor}`); if (method !== 'get') req.set('Idempotency-Key', key); return body ? req.send(body) : req; }
let clientId: string;
async function fixture() {
  const wedding = await api('post', '/weddings', 'planner', { clientIds: [clientId], wedding: { title: 'Fictional command-centre wedding', packageType: 'PARTIAL_DAY_OF', weddingDate: '2027-12-20', location: 'Udaipur' } }).expect(201);
  const id = wedding.body.id as string;
  for (const role of ['coordinator', 'finance'] as const) await api('post', `/weddings/${id}/assignments`, 'founder', { userId: users[role] }).expect(201);
  const vendors: Record<string, string> = {};
  for (const code of ['DJ_SOUND', 'CATERING', 'PHOTOGRAPHY', 'DECOR']) {
    const vendor = await api('post', '/vendors', 'planner', { name: `Fictional ${code} ${randomUUID()}`, categoryCode: code, contactName: 'Manager', email: `${randomUUID()}@operations.invalid`, phone: '+91 9999999999', serviceDetails: 'Client-contracted wedding service' }).expect(201);
    vendors[code] = vendor.body.id;
    await api('post', `/weddings/${id}/vendors/client-provided`, 'planner', { vendorId: vendor.body.id, clientProvidedContract: true, note: 'Client supplied this contracted vendor for execution coordination.' }).expect(201);
  }
  const root = await api('post', `/weddings/${id}/timeline`, 'planner', { title: 'Varmala', plannedStart: '2027-12-20T19:15:00+05:30', plannedEnd: '2027-12-20T19:30:00+05:30', ownerId: users.coordinator, vendorIds: [vendors.DJ_SOUND, vendors.PHOTOGRAPHY], dependsOnIds: [] }).expect(201);
  const dinner = await api('post', `/weddings/${id}/timeline`, 'planner', { title: 'Dinner', plannedStart: '2027-12-20T19:30:00+05:30', plannedEnd: '2027-12-20T20:30:00+05:30', ownerId: users.planner, vendorIds: [vendors.CATERING], dependsOnIds: [root.body.id] }).expect(201);
  const unrelated = await api('post', `/weddings/${id}/timeline`, 'planner', { title: 'Decor setup', plannedStart: '2027-12-20T17:00:00+05:30', plannedEnd: '2027-12-20T18:00:00+05:30', vendorIds: [vendors.DECOR], dependsOnIds: [] }).expect(201);
  return { id, vendors, root: root.body, dinner: dinner.body, unrelated: unrelated.body };
}
async function proposal(f: Awaited<ReturnType<typeof fixture>>, minutes = 25) {
  const timeline = await api('get', `/weddings/${f.id}/timeline`).expect(200);
  return api('post', `/timeline-events/${f.root.id}/schedule-changes`, 'coordinator', { expectedScheduleVersion: timeline.body.scheduleVersion, proposedStart: new Date(Date.parse(f.root.plannedStart) + minutes * 60000).toISOString(), proposedEnd: new Date(Date.parse(f.root.plannedEnd) + minutes * 60000).toISOString(), shiftDependents: true, reason: 'Bride procession timing has changed.' }).expect(201);
}
before(async () => {
  for (const [role, id] of Object.entries(users)) await owner.userProfile.create({ data: { id, email: `${role}@operations.invalid`, displayName: role, role: role === 'founder' ? 'FOUNDER' : role === 'coordinator' ? 'COORDINATOR' : role === 'client' ? 'CLIENT' : role === 'finance' ? 'FINANCE' : 'PLANNER' } });
  clientId = (await api('post', '/clients', 'founder', { name: 'Fictional wedding family', email: 'client@operations.invalid' }).expect(201)).body.id;
  await owner.client.update({ where: { id: clientId }, data: { userId: users.client } });
});
after(async () => { await db.$disconnect(); await owner.$disconnect(); });

describe('Phase 4 timeline, arrivals and incident handling', () => {
  it('stores timezone-correct timelines, explicit vendor links and dependency-safe versions', async () => {
    const f = await fixture();
    const timeline = await api('get', `/weddings/${f.id}/timeline`).expect(200);
    assert.equal(timeline.body.timezone, 'Asia/Kolkata');
    assert.equal(f.root.plannedStart, '2027-12-20T13:45:00.000Z');
    assert.equal(timeline.body.total, 3);
    assert.equal(timeline.body.scheduleVersion, 4);
    await api('patch', `/timeline-events/${f.root.id}`, 'planner', { expectedVersion: 1, dependsOnIds: [f.dinner.id] }).expect(409);
    const update = await api('patch', `/timeline-events/${f.root.id}`, 'planner', { expectedVersion: 1, title: 'Varmala ceremony' }).expect(200);
    assert.equal(update.body.version, 2);
    await api('patch', `/timeline-events/${f.root.id}`, 'planner', { expectedVersion: 1, title: 'Stale' }).expect(409);
    await api('patch', `/timeline-events/${f.root.id}`, 'planner', { expectedVersion: 2, plannedStart: '2027-12-20T14:10:00Z' }).expect(400);
    await api('get', `/weddings/${f.id}/timeline`, 'client').expect(403);
    await api('get', `/weddings/${f.id}/timeline`, 'other').expect(404);
  });
  it('tracks actual execution only for authorized owners with valid nonfuture times', async () => {
    const f = await fixture();
    const started = await api('post', `/timeline-events/${f.root.id}/execution`, 'coordinator', { expectedVersion: 1, status: 'IN_PROGRESS' }).expect(201);
    assert.ok(started.body.actualStart);
    await api('post', `/timeline-events/${f.dinner.id}/execution`, 'coordinator', { expectedVersion: 1, status: 'IN_PROGRESS' }).expect(403);
    const done = await api('post', `/timeline-events/${f.root.id}/execution`, 'coordinator', { expectedVersion: started.body.version, status: 'DONE' }).expect(201);
    assert.ok(done.body.actualEnd);
    await api('post', `/timeline-events/${f.root.id}/execution`, 'coordinator', { expectedVersion: done.body.version, status: 'IN_PROGRESS' }).expect(409);
  });
  it('calculates late status from expected versus confirmed/current time and records confirmation', async () => {
    const f = await fixture();
    const arrival = await api('post', `/weddings/${f.id}/vendor-arrivals`, 'planner', { vendorId: f.vendors.DJ_SOUND, expectedAt: new Date(Date.now() - 30 * 60000).toISOString(), coordinatorId: users.coordinator }).expect(201);
    assert.equal(arrival.body.isLate, true);
    assert.ok(arrival.body.lateMinutes >= 30);
    await api('post', `/vendor-arrivals/${arrival.body.id}/check-in`, 'other').expect(404);
    const key = randomUUID();
    const confirmed = await api('post', `/vendor-arrivals/${arrival.body.id}/check-in`, 'coordinator', {}, key).expect(201);
    assert.equal(confirmed.body.confirmedBy, users.coordinator);
    assert.equal(confirmed.body.isLate, true);
    assert.deepEqual((await api('post', `/vendor-arrivals/${arrival.body.id}/check-in`, 'coordinator', {}, key).expect(201)).body, confirmed.body);
    await api('post', `/vendor-arrivals/${arrival.body.id}/check-in`, 'coordinator', {}).expect(409);
  });
  it('creates private incidents, checks ownership/version and preserves resolution history', async () => {
    const f = await fixture();
    const incident = await api('post', `/weddings/${f.id}/incidents`, 'coordinator', { category: 'VENDOR_DELAY', severity: 'HIGH', description: 'The DJ is late and the sound check is pending.', ownerId: users.coordinator }).expect(201);
    await api('get', `/weddings/${f.id}/incidents`, 'client').expect(403);
    await api('patch', `/incidents/${incident.body.id}`, 'other', { expectedVersion: 1, status: 'IN_PROGRESS' }).expect(404);
    await api('patch', `/incidents/${incident.body.id}`, 'coordinator', { expectedVersion: 1, status: 'RESOLVED' }).expect(400);
    const resolved = await api('patch', `/incidents/${incident.body.id}`, 'coordinator', { expectedVersion: 1, status: 'RESOLVED', resolution: 'DJ arrived, backup sound checked and planner informed.' }).expect(200);
    assert.ok(resolved.body.resolvedAt);
    await api('patch', `/incidents/${incident.body.id}`, 'coordinator', { expectedVersion: 1, severity: 'LOW' }).expect(409);
    const history = await api('get', `/incidents/${incident.body.id}/history`).expect(200);
    assert.equal(history.body.total, 2);
    for (const [category, description] of [['EQUIPMENT', 'Florist requires an additional generator.'], ['LOGISTICS', 'The bride car is delayed in traffic.'], ['OTHER', 'An operational coordination issue needs review.']]) await api('post', `/weddings/${f.id}/incidents`, 'coordinator', { category, severity: 'MEDIUM', description, ownerId: users.coordinator }).expect(201);
  });
});

describe('Phase 4 closed-loop change approval and acknowledgement', () => {
  it('identifies only explicit vendors and dependent activities, and does not publish a proposal', async () => {
    const f = await fixture();
    const proposed = await proposal(f);
    assert.equal(proposed.body.status, 'PROPOSED');
    assert.equal(proposed.body.impacts.length, 2);
    const vendors = new Set(proposed.body.impacts.flatMap((impact: { vendorIds: string[] }) => impact.vendorIds));
    assert.ok(vendors.has(f.vendors.DJ_SOUND)); assert.ok(vendors.has(f.vendors.CATERING)); assert.ok(vendors.has(f.vendors.PHOTOGRAPHY)); assert.ok(!vendors.has(f.vendors.DECOR));
    assert.equal((await owner.timelineEvent.findUniqueOrThrow({ where: { id: f.root.id } })).plannedStart.toISOString(), f.root.plannedStart);
    await api('post', `/schedule-changes/${proposed.body.id}/publish`).expect(409);
    const rejected = await api('post', `/schedule-changes/${proposed.body.id}/reject`, 'planner', { note: 'Hold the original timing until the family confirms.' }).expect(201);
    assert.equal(rejected.body.status, 'REJECTED');
    assert.equal(rejected.body.decidedBy, users.planner);
    await api('post', `/schedule-changes/${proposed.body.id}/publish`).expect(409);
    assert.equal(await owner.scheduleNotification.count({ where: { weddingId: f.id } }), 0);
  });
  it('enforces independent approval and allows the founder to configure the policy explicitly', async () => {
    const f = await fixture();
    const schedule = await api('get', `/weddings/${f.id}/timeline`).expect(200);
    const created = await api('post', `/timeline-events/${f.root.id}/schedule-changes`, 'planner', { expectedScheduleVersion: schedule.body.scheduleVersion, proposedStart: '2027-12-20T19:40:00+05:30', proposedEnd: '2027-12-20T19:55:00+05:30', shiftDependents: true, reason: 'Planner requested a revised ceremony start.' }).expect(201);
    await api('post', `/schedule-changes/${created.body.id}/approve`, 'planner', { note: 'Approve my own proposed revision.' }).expect(403);
    await api('patch', `/weddings/${f.id}/schedule-policy`, 'planner', { independentApproval: false }).expect(403);
    await api('patch', `/weddings/${f.id}/schedule-policy`, 'founder', { independentApproval: false }).expect(200);
    const approved = await api('post', `/schedule-changes/${created.body.id}/approve`, 'planner', { note: 'Approved under explicitly configured single-planner demo policy.' }).expect(201);
    assert.equal(approved.body.status, 'APPROVED');
  });
  it('publishes exactly once and leaves every individual notification SENT, never auto-acknowledged', async () => {
    const f = await fixture();
    const change = await proposal(f);
    await api('post', `/schedule-changes/${change.body.id}/approve`, 'planner', { note: 'Reviewed affected vendors and the dependent dinner timing.' }).expect(201);
    const key = randomUUID();
    const publication = await api('post', `/schedule-changes/${change.body.id}/publish`, 'planner', undefined, key).expect(201);
    const notifications = await api('get', `/weddings/${f.id}/notifications?pageSize=100`).expect(200);
    assert.equal(notifications.body.data.filter((row: { vendorId: string | null }) => row.vendorId).length, 3);
    assert.ok(notifications.body.data.every((row: { status: string; deliveryStatus: string; acknowledgedAt: string | null }) => row.status === 'SENT' && row.deliveryStatus === 'AVAILABLE_IN_APP' && row.acknowledgedAt === null));
    const count = notifications.body.total;
    assert.deepEqual((await api('post', `/schedule-changes/${change.body.id}/publish`, 'planner', undefined, key).expect(201)).body, publication.body);
    await api('post', `/schedule-changes/${change.body.id}/publish`).expect(409);
    assert.equal(await owner.scheduleNotification.count({ where: { weddingId: f.id } }), count);
    const root = await owner.timelineEvent.findUniqueOrThrow({ where: { id: f.root.id } });
    assert.equal(root.plannedStart.toISOString(), '2027-12-20T14:10:00.000Z');
    assert.equal((await owner.timelineEvent.findUniqueOrThrow({ where: { id: f.unrelated.id } })).plannedStart.toISOString(), f.unrelated.plannedStart);
  });
  it('supports individual vendor ACKNOWLEDGED/PROBLEM responses, rotation and duplicate protection', async () => {
    const f = await fixture(); const change = await proposal(f);
    await api('post', `/schedule-changes/${change.body.id}/approve`, 'planner', { note: 'Approved revised timings for the affected recipients.' }).expect(201);
    await api('post', `/schedule-changes/${change.body.id}/publish`).expect(201);
    const notifications = (await api('get', `/weddings/${f.id}/notifications?pageSize=100`).expect(200)).body.data;
    const vendor = notifications.find((row: { vendorId: string | null }) => row.vendorId);
    const link = await api('post', `/notifications/${vendor.id}/vendor-link`).expect(201);
    const inbox = await request(app).get(`/api/v1/vendor-inbox/${link.body.token}`).expect(200);
    assert.equal(inbox.body.status, 'SENT');
    const first = await request(app).post(`/api/v1/vendor-inbox/${link.body.token}/respond`).send({ status: 'ACKNOWLEDGED' }).expect(200);
    const repeat = await request(app).post(`/api/v1/vendor-inbox/${link.body.token}/respond`).send({ status: 'ACKNOWLEDGED' }).expect(200);
    assert.deepEqual(first.body, repeat.body);
    await request(app).post(`/api/v1/vendor-inbox/${link.body.token}/respond`).send({ status: 'PROBLEM', problemDescription: 'Cannot meet this revised timing.' }).expect(409);
    const secondVendor = notifications.find((row: { vendorId: string | null; id: string }) => row.vendorId && row.id !== vendor.id);
    const problemLink = await api('post', `/notifications/${secondVendor.id}/vendor-link`).expect(201);
    await request(app).post(`/api/v1/vendor-inbox/${problemLink.body.token}/respond`).send({ status: 'PROBLEM' }).expect(400);
    const problem = await request(app).post(`/api/v1/vendor-inbox/${problemLink.body.token}/respond`).send({ status: 'PROBLEM', problemDescription: 'The vendor needs a revised equipment handover slot.' }).expect(200);
    assert.equal(problem.body.status, 'PROBLEM');
    const rotated = await api('post', `/notifications/${secondVendor.id}/vendor-link`).expect(201);
    await request(app).get(`/api/v1/vendor-inbox/${problemLink.body.token}`).expect(404);
    await request(app).get(`/api/v1/vendor-inbox/${rotated.body.token}`).expect(200);
    const staffNotification = notifications.find((row: { userId: string | null }) => row.userId === users.coordinator);
    await api('post', `/notifications/${staffNotification.id}/respond`, 'planner', { status: 'ACKNOWLEDGED' }).expect(403);
    await api('post', `/notifications/${staffNotification.id}/respond`, 'coordinator', { status: 'ACKNOWLEDGED' }).expect(201);
    assert.equal(await owner.auditLog.count({ where: { entityId: vendor.id, action: 'SCHEDULE_INSTRUCTION_RESPONDED' } }), 1);
  });
  it('rejects stale concurrent publications without losing schedule updates or audit history', async () => {
    const f = await fixture();
    const first = await proposal(f, 25), second = await proposal(f, 30);
    for (const change of [first, second]) await api('post', `/schedule-changes/${change.body.id}/approve`, 'planner', { note: 'Reviewed this proposal against the current base schedule.' }).expect(201);
    const published = await Promise.all([api('post', `/schedule-changes/${first.body.id}/publish`), api('post', `/schedule-changes/${second.body.id}/publish`)]);
    assert.deepEqual(published.map(row => row.status).sort(), [201, 409]);
    assert.equal(await owner.scheduleChange.count({ where: { weddingId: f.id, status: 'PUBLISHED' } }), 1);
    assert.equal(await owner.auditLog.count({ where: { weddingId: f.id, action: 'SCHEDULE_CHANGE_PUBLISHED' } }), 1);
    const history = await api('get', `/weddings/${f.id}/schedule-changes`).expect(200);
    assert.equal(history.body.total, 2);
    assert.ok(history.body.data.every((row: { previousStart: string; requestedBy: string }) => row.previousStart === f.root.plannedStart && row.requestedBy === users.coordinator));
    await api('get', `/weddings/${f.id}/notifications`, 'client').expect(403);
    await api('get', `/weddings/${f.id}/schedule-changes`, 'other').expect(404);
  });
});
