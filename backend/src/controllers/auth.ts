import type { PrismaClient } from '@prisma/client';
import type { IdentityProvider } from '../identity.js';
import { identityCall, verifiedIdentity } from '../identity.js';
import type { LoginRequest, RefreshRequest } from '../contracts.js';
import { authorizeSession } from '../services/auth.js';
import { ApiError } from '../errors.js';
import { audit } from '../access.js';

/**
 * Factory for authentication HTTP controller endpoints (login, refresh, logout).
 *
 * @param db - Prisma client instance
 * @param identity - Identity provider service for credentials and tokens
 */
export function authController(db: PrismaClient, identity: IdentityProvider) {
  return {
    async login(body: LoginRequest) { return authorizeSession(db, identity, await identityCall(() => identity.signIn(body.email, body.password))); },
    async refresh(body: RefreshRequest) { return authorizeSession(db, identity, await identityCall(() => identity.refresh(body.refreshToken))); },
    async logout(authorization: string | undefined) {
      const match = /^Bearer (\S+)$/i.exec(authorization ?? '');
      const id = match && await verifiedIdentity(identity, match[1]!);
      if (!id) throw new ApiError(401, 'UNAUTHENTICATED', 'A valid access token is required');
      await identityCall(() => identity.signOut(match![1]!));
      await audit(db, id, 'AUTH_LOGGED_OUT', id, null);
      return { success: true as const };
    },
  };
}
