import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createHash, randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient, type UserProfile, type Role } from '@prisma/client';
import { z } from 'zod';
import * as c from './contracts.js';
import { ApiError, forbidden, missing } from './errors.js';
import { audit, presentConsultation, presentEnquiry, presentWedding, weddingAccess, weddingFilter, weddingInclude, type Tx } from './access.js';
import type { IdentityProvider } from './identity.js';

export interface AppConfig { allowedOrigins: string[] }
type Context<B, Q> = { tx: Tx; user: UserProfile; body: B; query: Q; params: Record<string, string> };
const staffWrite: Role[] = ['FOUNDER', 'PLANNER'];
const everyone: Role[] = ['FOUNDER', 'PLANNER', 'COORDINATOR', 'FINANCE', 'CLIENT'];
const empty = z.object({}).strict();
const base = '/api/v1';
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

export function createApp(db: PrismaClient, identity: IdentityProvider, config: AppConfig, app = express()) {
  app.disable('x-powered-by');
  app.use((_req, res, next) => { res.locals.requestId = randomUUID(); res.setHeader('X-Request-Id', res.locals.requestId); next(); });
  app.use(helmet());
  app.use(cors({ origin(origin, done) {
    if (!origin || config.allowedOrigins.includes(origin)) done(null, true);
    else done(new ApiError(403, 'ORIGIN_FORBIDDEN', 'Origin is not allowed'));
  }, allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'], exposedHeaders: ['X-Request-Id'] }));
  app.use(express.json({ limit: '64kb' }));
  const paths: Record<string, Record<string, unknown>> = {};
  const security = [{ bearerAuth: [] }];
  const namedSchemas = new Map<z.ZodType, string>([[c.errorDto, 'ErrorResponse'], [c.profileDto, 'UserProfile'], [c.clientDto, 'Client'], [c.weddingDto, 'WeddingResponse'], [c.enquiryDto, 'EnquiryResponse'], [c.consultationDto, 'ConsultationResponse'], [c.assignmentDto, 'WeddingAssignment']]);
  const schemas = Object.fromEntries([...namedSchemas].map(([schema, name]) => [name, z.toJSONSchema(schema, { unrepresentable: 'any' })]));
  const responseSchema = (schema: z.ZodType) => namedSchemas.has(schema) ? { $ref: `#/components/schemas/${namedSchemas.get(schema)}` } : z.toJSONSchema(schema, { unrepresentable: 'any' });
  app.locals.openapi = { openapi: '3.1.0', info: { title: 'The Royal Knot Phase 1 API', version: '1.0.0' }, servers: [{ url: '/' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } }, schemas }, paths };
  app.get(`${base}/openapi.json`, (_req, res) => res.json(app.locals.openapi));
  app.get(`${base}/health`, (_req, res) => res.json({ status: 'ok' }));
  app.get(`${base}/ready`, async (_req, res, next) => {
    try { await db.userProfile.findFirst({ select: { id: true } }); res.json({ status: 'ready' }); }
    catch { next(new ApiError(503, 'NOT_READY', 'Database unavailable or migrations not applied')); }
  });
  for (const name of ['health', 'ready', 'openapi.json']) paths[`${base}/${name}`] = { get: { security: [], responses: { '200': { description: 'Success' }, ...(name === 'ready' ? { '503': { description: 'Unavailable' } } : {}) } } };
  app.use(base, async (req, res, next) => {
    try {
      const match = /^Bearer (\S+)$/i.exec(req.headers.authorization ?? '');
      if (!match) throw new ApiError(401, 'UNAUTHENTICATED', 'A valid access token is required');
      let id: string | null;
      try { id = await identity.verify(match[1]!); }
      catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable'); }
      if (!id) throw new ApiError(401, 'UNAUTHENTICATED', 'A valid access token is required');
      const user = await db.userProfile.findUnique({ where: { id } });
      if (!user?.active) throw new ApiError(403, 'ACCOUNT_DISABLED', 'An active invited account is required');
      res.locals.user = user;
      next();
    } catch (error) { next(error); }
  });

  function route<B extends z.ZodType = typeof empty, Q extends z.ZodType = typeof empty>(method: 'get' | 'post' | 'patch' | 'delete', path: string, options: {
    summary: string; roles?: Role[]; body?: B; query?: Q; response: z.ZodType;
    guard?: (ctx: Context<z.output<B>, z.output<Q>>) => Promise<unknown>;
    handler: (ctx: Context<z.output<B>, z.output<Q>>) => Promise<unknown>;
  }) {
    const write = method !== 'get';
    const parameters: Record<string, unknown>[] = [...path.matchAll(/:([A-Za-z]+)/g)].map(m => ({ name: m[1], in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }));
    if (write) parameters.push({ name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string', minLength: 8, maxLength: 128 }, description: 'Reuse only for retries of the same request. Different payload returns 409.' });
    if (options.query) {
      const querySchema = z.toJSONSchema(options.query, { unrepresentable: 'any', io: 'input' });
      for (const [name, schema] of Object.entries(querySchema.properties ?? {})) parameters.push({ name, in: 'query', required: querySchema.required?.includes(name) ?? false, schema });
    }
    const documentPath = `${base}${path}`.replace(/:([A-Za-z]+)/g, '{$1}');
    paths[documentPath] ??= {};
    paths[documentPath]![method] = {
      summary: options.summary, security, 'x-roles': options.roles ?? everyone, parameters,
      ...(options.body ? { requestBody: { required: true, content: { 'application/json': { schema: z.toJSONSchema(options.body, { io: 'input', unrepresentable: 'any' }) } } } } : {}),
      responses: { [method === 'post' ? '201' : '200']: { description: 'Success', content: { 'application/json': { schema: responseSchema(options.response) } } },
        ...Object.fromEntries([400, 401, 403, 404, 409, 413, 500, 503].map(status => [status, { description: 'Error', content: { 'application/json': { schema: responseSchema(c.errorDto) } } }])) },
    };
    app[method](`${base}${path}`, async (req, res, next) => {
      try {
        const user = res.locals.user as UserProfile;
        if (!(options.roles ?? everyone).includes(user.role)) throw forbidden();
        const params = z.record(z.string(), c.uuid).parse(req.params);
        const body = (options.body ?? empty).parse(req.body ?? {}) as z.output<B>;
        const query = (options.query ?? empty).parse(req.query) as z.output<Q>;
        const key = write ? z.string().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/).parse(req.header('Idempotency-Key')) : null;
        const fingerprint = createHash('sha256').update(JSON.stringify([method, req.path, body, query])).digest('hex');
        const response = await db.$transaction(async tx => {
          const ctx = { tx, user, body, query, params };
          await options.guard?.(ctx);
          if (key) {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${user.id}:${key}`}, 0))`;
            const previous = await tx.idempotencyRecord.findUnique({ where: { actorId_key: { actorId: user.id, key } } });
            if (previous) {
              if (previous.fingerprint !== fingerprint) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'This key was already used for a different request');
              return previous.response;
            }
          }
          const result = json(await options.handler(ctx));
          const checked = options.response.safeParse(result);
          if (!checked.success) throw new Error('Response contract violation');
          if (key) await tx.idempotencyRecord.create({ data: { actorId: user.id, key, fingerprint, response: result } });
          return result;
        }, { maxWait: 10000, timeout: 30000 });
        res.status(method === 'post' ? 201 : 200).json(response);
      } catch (error) { next(error); }
    });
  }

  route('get', '/me', { summary: 'Current active profile', response: c.profileDto, async handler({ user }) {
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role, active: user.active, timezone: 'Asia/Kolkata' };
  } });
  route('get', '/users', { summary: 'List staff profiles', roles: ['FOUNDER'], query: c.pageQuery, response: c.listOf(c.profileDto), async handler({ tx, query }) {
    const where = { role: { not: 'CLIENT' as const } };
    const rows = await tx.userProfile.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(u => ({ id: u.id, email: u.email, displayName: u.displayName, role: u.role, active: u.active, timezone: 'Asia/Kolkata' })), ...query, total: await tx.userProfile.count({ where }) };
  } });
  route('patch', '/users/:id', { summary: 'Founder updates staff role or account activity', roles: ['FOUNDER'], body: c.userPatch, response: c.profileDto, async handler({ tx, user, body, params }) {
    const target = await tx.userProfile.findUnique({ where: { id: params.id } });
    if (!target) throw missing();
    if (target.role === 'FOUNDER' || (target.role === 'CLIENT' && body.role)) throw forbidden();
    const row = await tx.userProfile.update({ where: { id: target.id }, data: body });
    await audit(tx, user.id, 'USER_UPDATED', row.id, null, body);
    return { id: row.id, email: row.email, displayName: row.displayName, role: row.role, active: row.active, timezone: 'Asia/Kolkata' };
  } });
  route('post', '/invitations', { summary: 'Invite staff or explicitly linked client', roles: staffWrite, body: c.invitationInput, response: c.profileDto,
    async guard({ tx, user, body }) {
      if (user.role !== 'FOUNDER' && body.role !== 'CLIENT') throw forbidden();
      if (body.role === 'CLIENT') {
        await weddingAccess(tx, user, body.weddingId!, true);
        const link = await tx.weddingClient.findUnique({ where: { weddingId_clientId: { weddingId: body.weddingId!, clientId: body.clientId! } }, include: { client: true } });
        if (!link || link.client.email !== body.email) throw new ApiError(400, 'INVALID_CLIENT_LINK', 'The explicit client must belong to the wedding and match the invited email');
      }
    }, async handler({ tx, user, body }) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`invite:${body.email}`}, 0))`;
      const existing = await tx.userProfile.findUnique({ where: { email: body.email }, include: { client: true } });
      if (existing && (existing.role !== body.role || !existing.active || (body.role === 'CLIENT' && existing.client?.id !== body.clientId))) throw new ApiError(409, 'ACCOUNT_CONFLICT', 'This identity is already linked; founder must review it');
      const id = existing?.id ?? await identity.invite(body.email);
      const profile = existing ?? await tx.userProfile.create({ data: { id, email: body.email, displayName: body.displayName, role: body.role } });
      if (body.role === 'CLIENT') {
        const client = await tx.client.findUniqueOrThrow({ where: { id: body.clientId } });
        if (client.userId && client.userId !== id) throw new ApiError(409, 'ACCOUNT_CONFLICT', 'Client is already linked to another account');
        await tx.client.update({ where: { id: client.id }, data: { userId: id } });
      }
      await audit(tx, user.id, 'USER_INVITED', id, body.weddingId ?? null, { role: body.role, clientId: body.clientId ?? null });
      return { id: profile.id, email: profile.email, displayName: profile.displayName, role: profile.role, active: profile.active, timezone: 'Asia/Kolkata' };
    },
  });

  route('post', '/clients', { summary: 'Create a client contact', roles: staffWrite, body: c.clientInput, response: c.clientDto, async handler({ tx, user, body }) {
    const row = await tx.client.create({ data: body });
    await audit(tx, user.id, 'CLIENT_CREATED', row.id, null);
    return row;
  } });
  route('get', '/clients', { summary: 'List accessible clients', roles: everyone.filter(r => r !== 'CLIENT'), query: c.pageQuery, response: c.listOf(c.clientDto), async handler({ tx, user, query }) {
    const where: Prisma.ClientWhereInput = user.role === 'FOUNDER' ? {} : { weddings: { some: { wedding: weddingFilter(user) } } };
    return { data: await tx.client.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }), ...query, total: await tx.client.count({ where }) };
  } });
  route('get', '/clients/:id', { summary: 'Read accessible client contact', roles: everyone.filter(r => r !== 'CLIENT'), response: c.clientDto, async handler({ tx, user, params }) {
    const row = await tx.client.findFirst({ where: { id: params.id, ...(user.role === 'FOUNDER' ? {} : { weddings: { some: { wedding: weddingFilter(user) } } }) } });
    if (!row) throw missing();
    return row;
  } });
  route('patch', '/clients/:id', { summary: 'Update client contact; account linking is invitation-only', roles: staffWrite, body: c.clientInput.partial().refine(v => Object.keys(v).length > 0), response: c.clientDto,
    async guard({ tx, user, params }) {
      if (!await tx.client.findFirst({ where: { id: params.id, ...(user.role === 'FOUNDER' ? {} : { weddings: { some: { wedding: weddingFilter(user) } } }) } })) throw missing();
    }, async handler({ tx, user, params, body }) {
      const current = await tx.client.findUniqueOrThrow({ where: { id: params.id } });
      if (current.userId && body.email && current.email !== body.email) throw new ApiError(409, 'LINKED_EMAIL', 'Linked account email changes require administrative review');
      const row = await tx.client.update({ where: { id: params.id }, data: body });
      await audit(tx, user.id, 'CLIENT_UPDATED', row.id, null);
      return row;
    },
  });

  route('post', '/enquiries', { summary: 'Create enquiry and provisional wedding atomically', roles: staffWrite, body: c.enquiryInput, response: z.object({ enquiry: c.enquiryDto, wedding: c.weddingDto }).strict(),
    async guard({ tx, user, body }) {
      // A planner may attach an unused contact or one already accessible through assignments.
      const count = await tx.client.count({ where: { id: { in: body.clientIds }, ...(user.role === 'FOUNDER' ? {} : { OR: [{ weddings: { none: {} } }, { weddings: { some: { wedding: weddingFilter(user) } } }] }) } });
      if (count !== body.clientIds.length) throw new ApiError(400, 'INVALID_CLIENTS', 'One or more client contacts are unavailable');
    }, async handler({ tx, user, body }) {
      const wedding = await tx.wedding.create({ data: {
        ...body.wedding, weddingDate: body.wedding.weddingDate ? new Date(body.wedding.weddingDate) : null,
        clients: { create: body.clientIds.map(clientId => ({ clientId })) },
        ...(user.role === 'PLANNER' ? { assignments: { create: { userId: user.id } } } : {}),
        enquiry: { create: { source: body.source, internalNotes: body.internalNotes } },
      }, include: { ...weddingInclude, enquiry: true } });
      await audit(tx, user.id, 'ENQUIRY_CREATED', wedding.enquiry!.id, wedding.id);
      return { wedding: presentWedding(wedding, user), enquiry: presentEnquiry(wedding.enquiry!, user) };
    },
  });
  route('get', '/enquiries', { summary: 'List accessible enquiries', query: c.pageQuery.extend({ stage: c.enquiryStage.optional() }), response: c.listOf(c.enquiryDto), async handler({ tx, user, query }) {
    const where: Prisma.EnquiryWhereInput = { wedding: weddingFilter(user), stage: query.stage };
    const rows = await tx.enquiry.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(row => presentEnquiry(row, user)), page: query.page, pageSize: query.pageSize, total: await tx.enquiry.count({ where }) };
  } });
  route('get', '/enquiries/:id', { summary: 'Read accessible enquiry', response: c.enquiryDto, async handler({ tx, user, params }) {
    const row = await tx.enquiry.findFirst({ where: { id: params.id, wedding: weddingFilter(user) } });
    if (!row) throw missing();
    return presentEnquiry(row, user);
  } });
  route('patch', '/enquiries/:id', { summary: 'Update enquiry stage independently from wedding lifecycle', roles: staffWrite, body: c.enquiryPatch, response: c.enquiryDto,
    async guard({ tx, user, params }) { if (!await tx.enquiry.findFirst({ where: { id: params.id, wedding: weddingFilter(user) } })) throw missing(); },
    async handler({ tx, user, body, params }) {
      const before = await tx.enquiry.findUniqueOrThrow({ where: { id: params.id } });
      const row = await tx.enquiry.update({ where: { id: params.id }, data: body });
      await audit(tx, user.id, 'ENQUIRY_UPDATED', row.id, row.weddingId, { previousStage: before.stage, stage: row.stage });
      return presentEnquiry(row, user);
    },
  });

  route('get', '/weddings', { summary: 'List accessible weddings', query: c.pageQuery.extend({ state: c.weddingState.optional() }), response: c.listOf(c.weddingDto), async handler({ tx, user, query }) {
    const where = { ...weddingFilter(user), state: query.state };
    const rows = await tx.wedding.findMany({ where, include: weddingInclude, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(row => presentWedding(row, user)), page: query.page, pageSize: query.pageSize, total: await tx.wedding.count({ where }) };
  } });
  route('get', '/weddings/:id', { summary: 'Read accessible wedding; explicit client-safe projection', response: c.weddingDto, async handler({ tx, user, params }) {
    const row = await tx.wedding.findFirst({ where: { id: params.id, ...weddingFilter(user) }, include: weddingInclude });
    if (!row) throw missing();
    return presentWedding(row, user);
  } });
  route('patch', '/weddings/:id', { summary: 'Update wedding details or Phase 1 lifecycle state', roles: staffWrite, body: c.weddingPatch, response: c.weddingDto,
    async guard({ tx, user, params, body }) {
      await weddingAccess(tx, user, params.id!, true);
      if (body.budgetMax !== undefined && user.role !== 'FOUNDER') throw forbidden();
    }, async handler({ tx, user, params, body }) {
      const before = await tx.wedding.findUniqueOrThrow({ where: { id: params.id } });
      if (body.state && !({ ENQUIRY: ['PROPOSAL', 'CANCELLED'], PROPOSAL: ['ENQUIRY', 'CANCELLED'] } as Record<string, string[]>)[before.state]?.includes(body.state)) throw new ApiError(409, 'INVALID_TRANSITION', 'This wedding lifecycle transition is unavailable in Phase 1');
      const row = await tx.wedding.update({ where: { id: params.id }, data: { ...body, ...(body.weddingDate !== undefined ? { weddingDate: body.weddingDate ? new Date(body.weddingDate) : null } : {}) }, include: weddingInclude });
      await audit(tx, user.id, 'WEDDING_UPDATED', row.id, row.id, { previousState: before.state, state: row.state });
      return presentWedding(row, user);
    },
  });
  route('post', '/weddings/:id/clients', { summary: 'Explicitly link an existing contact to a wedding', roles: ['FOUNDER'], body: z.object({ clientId: c.uuid }).strict(), response: z.object({ weddingId: c.uuid, clientId: c.uuid }).strict(),
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); },
    async handler({ tx, user, params, body }) {
      const row = await tx.weddingClient.upsert({ where: { weddingId_clientId: { weddingId: params.id!, clientId: body.clientId } }, create: { weddingId: params.id!, clientId: body.clientId }, update: {} });
      await audit(tx, user.id, 'CLIENT_LINKED', body.clientId, params.id!);
      return row;
    },
  });
  route('post', '/weddings/:id/assignments', { summary: 'Founder assigns active staff', roles: ['FOUNDER'], body: z.object({ userId: c.uuid }).strict(), response: c.assignmentDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); },
    async handler({ tx, user, params, body }) {
      const staff = await tx.userProfile.findUnique({ where: { id: body.userId } });
      if (!staff?.active || staff.role === 'CLIENT') throw new ApiError(400, 'INVALID_STAFF', 'An active staff profile is required');
      const row = await tx.weddingAssignment.upsert({ where: { weddingId_userId: { weddingId: params.id!, userId: body.userId } }, create: { weddingId: params.id!, userId: body.userId }, update: {} });
      await audit(tx, user.id, 'STAFF_ASSIGNED', body.userId, params.id!);
      return row;
    },
  });
  route('delete', '/weddings/:id/assignments/:userId', { summary: 'Founder removes staff assignment', roles: ['FOUNDER'], response: c.assignmentDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); },
    async handler({ tx, user, params }) {
      const active = await tx.consultation.count({ where: { weddingId: params.id, plannerId: params.userId, state: 'CONFIRMED' } });
      if (active) throw new ApiError(409, 'ACTIVE_BOOKINGS', 'Reassign or cancel confirmed consultations before removing this staff member');
      await tx.weddingAssignment.deleteMany({ where: { weddingId: params.id, userId: params.userId } });
      await audit(tx, user.id, 'STAFF_UNASSIGNED', params.userId!, params.id!);
      return { weddingId: params.id, userId: params.userId };
    },
  });

  route('post', '/consultations', { summary: 'Request consultation; never confirms a booking', body: c.requestConsultation, response: c.consultationDto,
    roles: ['FOUNDER', 'PLANNER', 'CLIENT'], async guard({ tx, user, body }) {
      const wedding = await weddingAccess(tx, user, body.weddingId);
      if (wedding.state === 'CANCELLED' || wedding.state === 'COMPLETED') throw new ApiError(409, 'WEDDING_CLOSED', 'Consultations cannot be requested for a closed wedding');
    }, async handler({ tx, user, body }) {
      if (Date.parse(body.preferredAt) <= Date.now()) throw new ApiError(400, 'INVALID_TIME', 'Preferred time must be in the future');
      const row = await tx.consultation.create({ data: { ...body, preferredAt: new Date(body.preferredAt), requestedBy: user.id } });
      await audit(tx, user.id, 'CONSULTATION_REQUESTED', row.id, row.weddingId);
      return presentConsultation(row, user);
    },
  });
  route('get', '/consultations', { summary: 'List accessible consultation requests and appointments', query: c.pageQuery.extend({ weddingId: c.uuid.optional(), state: c.consultationState.optional() }), response: c.listOf(c.consultationDto), async handler({ tx, user, query }) {
    const where: Prisma.ConsultationWhereInput = { wedding: weddingFilter(user), weddingId: query.weddingId, state: query.state };
    const rows = await tx.consultation.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(row => presentConsultation(row, user)), page: query.page, pageSize: query.pageSize, total: await tx.consultation.count({ where }) };
  } });
  route('get', '/consultations/:id', { summary: 'Read accessible consultation', response: c.consultationDto, async handler({ tx, user, params }) {
    const row = await tx.consultation.findFirst({ where: { id: params.id, wedding: weddingFilter(user) } });
    if (!row) throw missing();
    return presentConsultation(row, user);
  } });
  route('patch', '/consultations/:id', { summary: 'Planner confirms, reschedules, completes or cancels consultation', roles: staffWrite, body: c.consultationDecision, response: c.consultationDto,
    async guard({ tx, user, params }) { if (!await tx.consultation.findFirst({ where: { id: params.id, wedding: weddingFilter(user) } })) throw missing(); },
    async handler({ tx, user, body, params }) {
      await tx.$queryRaw`SELECT id FROM app."Consultation" WHERE id = ${params.id!}::uuid FOR UPDATE`;
      const before = await tx.consultation.findUniqueOrThrow({ where: { id: params.id } });
      if (['COMPLETED', 'CANCELLED'].includes(before.state) || (body.state === 'COMPLETED' && before.state !== 'CONFIRMED')) throw new ApiError(409, 'INVALID_TRANSITION', 'This consultation decision is not allowed');
      if (body.state === 'CONFIRMED') {
        const wedding = await weddingAccess(tx, user, before.weddingId, true);
        if (['CANCELLED', 'COMPLETED'].includes(wedding.state)) throw new ApiError(409, 'WEDDING_CLOSED', 'Cannot confirm a consultation for a closed wedding');
        if (Date.parse(body.startAt) <= Date.now()) throw new ApiError(400, 'INVALID_TIME', 'Confirmed start must be in the future');
        const assigned = await tx.weddingAssignment.findUnique({ where: { weddingId_userId: { weddingId: before.weddingId, userId: body.plannerId } }, include: { user: true } });
        if (!assigned?.user.active || assigned.user.role !== 'PLANNER') throw new ApiError(400, 'INVALID_PLANNER', 'Responsible planner must be active and assigned to this wedding');
      }
      const row = await tx.consultation.update({ where: { id: params.id }, data: body.state === 'CONFIRMED'
        ? { ...body, startAt: new Date(body.startAt), endAt: new Date(body.endAt) } : body });
      await audit(tx, user.id, 'CONSULTATION_DECIDED', row.id, row.weddingId, { previousState: before.state, previousStartAt: before.startAt?.toISOString() ?? null, previousEndAt: before.endAt?.toISOString() ?? null, previousPlannerId: before.plannerId, state: row.state, startAt: row.startAt?.toISOString() ?? null, endAt: row.endAt?.toISOString() ?? null, plannerId: row.plannerId });
      return presentConsultation(row, user);
    },
  });

  app.use((_req, _res, next) => next(missing()));
  const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    let status = 500, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred';
    let fields: { path: string; message: string }[] | undefined;
    if (error instanceof ApiError) ({ status, code, message } = error);
    else if (error instanceof z.ZodError) { status = 400; code = 'VALIDATION_ERROR'; message = 'Invalid request'; fields = error.issues.map(i => ({ path: i.path.join('.'), message: i.message })); }
    else if (error instanceof Prisma.PrismaClientUnknownRequestError && error.message.includes('consultation_no_overlap')) {
      // Prisma 6 reports PostgreSQL exclusion violations as UnknownRequestError.
      status = 409; code = 'SCHEDULING_CONFLICT'; message = 'The planner already has an overlapping confirmed consultation';
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { status = 409; code = 'DUPLICATE_RECORD'; message = 'A record with these unique values already exists'; }
      else if (error.code === 'P2003' || error.code === 'P2025') { status = 400; code = 'INVALID_REFERENCE'; message = 'A referenced record is unavailable'; }
      else if (error.meta?.code === '23P01' || String(error.meta?.database_error ?? '').includes('consultation_no_overlap')) { status = 409; code = 'SCHEDULING_CONFLICT'; message = 'The planner already has an overlapping confirmed consultation'; }
      else if (error.code === 'P2034') { status = 409; code = 'CONCURRENT_CHANGE'; message = 'A concurrent change occurred; retry with the same key'; }
      else if (['P2024', 'P2028', 'P1001', 'P1002'].includes(error.code)) { status = 503; code = 'DATABASE_UNAVAILABLE'; message = 'Database temporarily unavailable'; }
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      status = 503; code = 'DATABASE_UNAVAILABLE'; message = 'Database temporarily unavailable';
    } else if (error && typeof error === 'object' && 'type' in error) {
      if (error.type === 'entity.parse.failed') { status = 400; code = 'INVALID_JSON'; message = 'Malformed JSON body'; }
      if (error.type === 'entity.too.large') { status = 413; code = 'BODY_TOO_LARGE'; message = 'Request body exceeds 64kb'; }
    }
    if (status === 500) console.error(JSON.stringify({ requestId: res.locals.requestId, code, errorType: error instanceof Error ? error.name : 'Unknown', ...(error instanceof Prisma.PrismaClientKnownRequestError ? { databaseCode: error.code } : {}) }));
    res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}), requestId: res.locals.requestId } });
  };
  app.use(errorHandler);
  return app;
}
