import type { PrismaClient } from '@prisma/client';
import type { IdentityProvider, IdentitySession } from '../identity.js';
import { ApiError } from '../errors.js';
import { audit } from '../access.js';
import { uuid, sessionDto } from '../contracts.js';

/**
 * Validates an identity session, checks account active status, logs audit event,
 * and returns an authenticated user token payload.
 *
 * @param db - Prisma client instance
 * @param identity - Identity provider
 * @param session - Identity session candidate
 */
export async function authorizeSession(db: PrismaClient, identity: IdentityProvider, session: IdentitySession | null) {
  if (!session) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials or session');
  try {
    const token = sessionDto.shape.accessToken;
    if (!uuid.safeParse(session.userId).success || !token.safeParse(session.accessToken).success || !token.safeParse(session.refreshToken).success || !sessionDto.shape.expiresAt.safeParse(session.expiresAt).success || session.tokenType !== 'bearer') throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Authentication service returned an invalid session');
    if (session.expiresAt <= Math.floor(Date.now() / 1000)) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials or session');
    return await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM app."UserProfile" WHERE id=${session.userId}::uuid FOR SHARE`;
      const user = await tx.userProfile.findUnique({ where: { id: session.userId } });
      if (!user?.active) throw new ApiError(403, 'ACCOUNT_DISABLED', 'An active invited account is required');
      await audit(tx, user.id, 'AUTH_SESSION_ISSUED', user.id, null);
      return { accessToken: session.accessToken, refreshToken: session.refreshToken, expiresAt: session.expiresAt, tokenType: session.tokenType,
        user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, active: user.active, timezone: 'Asia/Kolkata' as const } };
    });
  } catch (error) {
    if (typeof session.accessToken === 'string' && session.accessToken.length > 0) await identity.signOut(session.accessToken).catch(() => {});
    throw error;
  }
}
