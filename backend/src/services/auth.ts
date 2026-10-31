import type { PrismaClient } from '@prisma/client';
import type { IdentityProvider, IdentitySession } from '../identity.js';
import { ApiError } from '../errors.js';
import { audit } from '../access.js';

export async function authorizeSession(db: PrismaClient, identity: IdentityProvider, session: IdentitySession | null) {
  if (!session) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials or session');
  try {
    const user = await db.userProfile.findUnique({ where: { id: session.userId } });
    if (!user?.active) throw new ApiError(403, 'ACCOUNT_DISABLED', 'An active invited account is required');
    await audit(db, user.id, 'AUTH_SESSION_ISSUED', user.id, null);
    return { accessToken: session.accessToken, refreshToken: session.refreshToken, expiresAt: session.expiresAt, tokenType: session.tokenType,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, active: user.active, timezone: 'Asia/Kolkata' as const } };
  } catch (error) {
    await identity.signOut(session.accessToken).catch(() => {});
    throw error;
  }
}
