import type { RequestHandler } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { IdentityProvider } from '../identity.js';
import { ApiError } from '../errors.js';

export function authenticate(db: PrismaClient, identity: IdentityProvider): RequestHandler {
  return async (req, res, next) => {
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

  };
}
