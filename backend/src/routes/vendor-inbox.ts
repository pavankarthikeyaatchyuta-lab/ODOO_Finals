/**
 * =============================================================================
 * File: vendor-inbox.ts
 * Module: API Route Definition Router
 * =============================================================================
 * Registers RESTful API endpoints and maps HTTP route paths to service handlers and security policies for vendor-inbox.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import type { Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import * as o from '../operations-contracts.js';
import { capabilityNotification, presentNotification, respondNotification } from '../services/operations.js';

/**
 * Registers magic link token vendor notification and acknowledgment endpoints.
 */
export function registerVendorInbox(app: Express, db: PrismaClient) {
  const token = z.string().regex(/^[0-9a-f]{64}$/);
  for (const method of ['get', 'post'] as const) {
    const path = `/api/v1/vendor-inbox/:token${method === 'post' ? '/respond' : ''}`;
    const documentPath = path.replace(':token', '{token}');
    app.locals.openapi.paths[documentPath] = { [method]: { summary: 'Vendor in-app instruction access via a scoped 24-hour capability; not an authenticated global vendor session', security: [], parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string', pattern: '^[0-9a-f]{64}$' } }], ...(method === 'post' ? { requestBody: { required: true, content: { 'application/json': { schema: z.toJSONSchema(o.responseInput) } } } } : {}), responses: { '200': { description: 'Success', content: { 'application/json': { schema: z.toJSONSchema(o.notificationDto) } } }, '400': { description: 'Invalid request' }, '404': { description: 'Invalid, rotated or expired capability' }, '409': { description: 'Conflicting previous response' } } } };
    app[method](path, async (req, res, next) => {
      try {
        res.set('Cache-Control', 'no-store');
        const value = token.parse(req.params.token); z.object({}).strict().parse(req.query);
        const body = method === 'post' ? o.responseInput.parse(req.body) : null;
        const result = await db.$transaction(async tx => {
          const notification = await capabilityNotification(tx, value);
          return body ? respondNotification(tx, notification, body, notification.vendorId!, 'VENDOR_CAPABILITY') : presentNotification(notification);
        });
        res.json(result);
      } catch (error) { next(error); }
    });
  }
}
