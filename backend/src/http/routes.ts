import type { Express } from 'express';
import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient, type UserProfile, type Role } from '@prisma/client';
import { z } from 'zod';
import * as c from '../contracts.js';
import { ApiError, forbidden } from '../errors.js';
import type { Tx } from '../access.js';

export type Context<B, Q> = { tx: Tx; user: UserProfile; body: B; query: Q; params: Record<string, string> };
export const staffWrite: Role[] = ['FOUNDER', 'PLANNER'];
export const everyone: Role[] = ['FOUNDER', 'PLANNER', 'COORDINATOR', 'FINANCE', 'CLIENT'];
const empty = z.object({}).strict();
const base = '/api/v1';
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

export function createRouteRegistrar(app: Express, db: PrismaClient) {
  const paths: Record<string, Record<string, unknown>> = {};
  const security = [{ bearerAuth: [] }];
  const namedSchemas = new Map<z.ZodType, string>([[c.errorDto, 'ErrorResponse'], [c.profileDto, 'UserProfile'], [c.clientDto, 'Client'], [c.weddingDto, 'WeddingResponse'], [c.enquiryDto, 'EnquiryResponse'], [c.consultationDto, 'ConsultationResponse'], [c.assignmentDto, 'WeddingAssignment']]);
  const schemas = Object.fromEntries([...namedSchemas].map(([schema, name]) => [name, z.toJSONSchema(schema, { unrepresentable: 'any' })]));
  const responseSchema = (schema: z.ZodType) => namedSchemas.has(schema) ? { $ref: `#/components/schemas/${namedSchemas.get(schema)}` } : z.toJSONSchema(schema, { unrepresentable: 'any' });
  app.locals.openapi = { openapi: '3.1.0', info: { title: 'The Royal Knot Phase 1 API', version: '1.0.0' }, servers: [{ url: '/' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } }, schemas }, paths };
  for (const name of ['health', 'ready', 'openapi.json']) paths[`${base}/${name}`] = { get: { security: [], responses: { '200': { description: 'Success' }, ...(name === 'ready' ? { '503': { description: 'Unavailable' } } : {}) } } };

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


  return route;
}
export type RouteRegistrar = ReturnType<typeof createRouteRegistrar>;
