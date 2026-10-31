/**
 * =============================================================================
 * File: auth.ts
 * Module: API Route Definition Router
 * =============================================================================
 * Registers RESTful API endpoints and maps HTTP route paths to service handlers and security policies for auth.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import type { Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { IdentityProvider } from '../identity.js';
import * as c from '../contracts.js';
import { authController } from '../controllers/auth.js';
import { consumeAuthLimit } from '../services/rate-limit.js';

/**
 * Registers public authentication endpoints (sign in, token refresh, password recovery, logout).
 */
export function registerAuthRoutes(app: Express, db: PrismaClient, identity: IdentityProvider) {
  const controller = authController(db, identity);
  // Authentication tokens/passwords must never enter the business idempotency cache.
  app.use('/api/v1/auth', (_req, res, next) => { res.set('Cache-Control', 'no-store'); res.set('Pragma', 'no-cache'); next(); });
  function endpoint<B extends z.ZodType>(path: string, body: B, response: z.ZodType, handler: (input: z.output<B>, authorization?: string) => Promise<unknown>, protectedRoute = false) {
    app.locals.openapi.paths[`/api/v1/auth/${path}`] = { post: {
      summary: `${path} Supabase session`, security: protectedRoute ? [{ bearerAuth: [] }] : [],
      requestBody: { required: path !== 'logout', content: { 'application/json': { schema: z.toJSONSchema(body, { io: 'input', unrepresentable: 'any' }) } } },
      responses: { '200': { description: 'Success', content: { 'application/json': { schema: z.toJSONSchema(response) } } },
        ...Object.fromEntries([400, 401, 403, 429, 500, 503].map(status => [status, { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }])) },
    } };
    app.post(`/api/v1/auth/${path}`, async (req, res, next) => {
      try {
        z.object({}).strict().parse(req.query);
        const input = body.parse(req.body ?? {});
        if (path !== 'logout') {
          await consumeAuthLimit(db, `auth-ip-${path}`, req.ip ?? req.socket.remoteAddress ?? 'unknown', 60);
          if (path === 'login') await consumeAuthLimit(db, 'auth-email', c.loginInput.parse(input).email, 10);
        }
        const output = await handler(input, req.headers.authorization);
        if (!response.safeParse(output).success) throw new Error('Authentication response contract violation');
        res.json(output);
      } catch (error) { next(error); }
    });
  }
  endpoint('login', c.loginInput, c.sessionDto, controller.login);
  endpoint('refresh', c.refreshInput, c.sessionDto, controller.refresh);
  endpoint('logout', z.object({}).strict(), c.successDto, (_body, authorization) => controller.logout(authorization), true);
}
