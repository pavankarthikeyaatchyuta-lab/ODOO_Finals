import type { RequestHandler } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { IdentityProvider } from '../identity.js';
import { verifiedIdentity } from '../identity.js';
import { ApiError } from '../errors.js';

/**
 * Express middleware extracting and validating Bearer tokens against the identity provider and database.
 * Attaches the authenticated UserProfile to res.locals.user.
 *
 * @param db - Prisma client
 * @param identity - Identity provider
 */
export function authenticate(db: PrismaClient, identity: IdentityProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const match = /^Bearer (\S+)$/i.exec(req.headers.authorization ?? '');
      if (!match) throw new ApiError(401, 'UNAUTHENTICATED', 'A valid access token is required');
      const id = await verifiedIdentity(identity, match[1]!);
      if (!id) throw new ApiError(401, 'UNAUTHENTICATED', 'A valid access token is required');
      const user = await db.userProfile.findUnique({ where: { id } });
      if (!user?.active) throw new ApiError(403, 'ACCOUNT_DISABLED', 'An active invited account is required');
      res.locals.user = user;
      next();
    } catch (error) { next(error); }

  };
}
