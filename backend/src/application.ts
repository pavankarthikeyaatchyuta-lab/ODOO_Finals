import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { ApiError, missing, errorHandler } from './errors.js';
import type { IdentityProvider } from './identity.js';
import { createRouteRegistrar } from './http/routes.js';
import { authenticate } from './middleware/authentication.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerUsersRoutes } from './routes/users.js';
import { registerClientsRoutes } from './routes/clients.js';
import { registerEnquiriesRoutes } from './routes/enquiries.js';
import { registerWeddingsRoutes } from './routes/weddings.js';
import { registerConsultationsRoutes } from './routes/consultations.js';
import { registerDocumentsRoutes } from './routes/documents.js';
import { registerAgreementsRoutes } from './routes/agreements.js';
import { registerVendorsRoutes } from './routes/vendors.js';
import { registerQuotationsRoutes } from './routes/quotations.js';
import { registerPlanningRoutes } from './routes/planning.js';
import { registerActivityRoutes } from './routes/activity.js';
import { registerOperationsRoutes } from './routes/operations.js';
import { registerVendorInbox } from './routes/vendor-inbox.js';
import { unavailableStore, type DocumentStore } from './storage.js';

export interface AppConfig { allowedOrigins: string[]; documents?: DocumentStore }
const base = '/api/v1';

export function createApp(db: PrismaClient, identity: IdentityProvider, config: AppConfig, app = express()) {
  app.disable('x-powered-by');
  app.use((_req, res, next) => { res.locals.requestId = randomUUID(); res.setHeader('X-Request-Id', res.locals.requestId); next(); });
  app.use(helmet());
  app.use(cors({ origin(origin, done) {
    if (!origin || config.allowedOrigins.includes(origin)) done(null, true);
    else done(new ApiError(403, 'ORIGIN_FORBIDDEN', 'Origin is not allowed'));
  }, allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'], exposedHeaders: ['X-Request-Id'] }));
  app.use(express.json({ limit: '64kb' }));
  const route = createRouteRegistrar(app, db);
  app.get(`${base}/openapi.json`, (_req, res) => res.json(app.locals.openapi));
  app.get(`${base}/health`, (_req, res) => res.json({ status: 'ok' }));
  app.get(`${base}/ready`, async (_req, res, next) => {
    try { await db.userProfile.findFirst({ select: { id: true } }); res.json({ status: 'ready' }); }
    catch { next(new ApiError(503, 'NOT_READY', 'Database unavailable or migrations not applied')); }
  });

  registerAuthRoutes(app, db, identity);
  registerVendorInbox(app, db);
  app.use(base, authenticate(db, identity));
  registerUsersRoutes(route, identity);
  registerClientsRoutes(route);
  registerEnquiriesRoutes(route);
  registerWeddingsRoutes(route);
  registerConsultationsRoutes(route);
  registerDocumentsRoutes(route, config.documents ?? unavailableStore);
  registerAgreementsRoutes(route);
  registerVendorsRoutes(route);
  registerQuotationsRoutes(route);
  registerPlanningRoutes(route);
  registerActivityRoutes(route);
  registerOperationsRoutes(route);
  app.use((_req, _res, next) => next(missing()));
  app.use(errorHandler);
  return app;
}
