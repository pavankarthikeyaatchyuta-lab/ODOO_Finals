/**
 * =============================================================================
 * File: identity.ts
 * Module: Identity Provider & Authentication Provider
 * =============================================================================
 * Interfaces with Supabase Auth or mock JWT engines to authenticate credentials, generate sessions, and verify auth tokens.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import { createClient, type AuthError, type Session } from '@supabase/supabase-js';
import { ApiError } from './errors.js';
import { uuid } from './contracts.js';

export interface IdentityProvider {
  verify(token: string): Promise<string | null>;
  invite(email: string): Promise<string>;
  signIn(email: string, password: string): Promise<IdentitySession | null>;
  refresh(refreshToken: string): Promise<IdentitySession | null>;
  signOut(accessToken: string): Promise<void>;
}

export interface IdentitySession { userId: string; accessToken: string; refreshToken: string; expiresAt: number; tokenType: 'bearer' }

/**
 * Wraps external Supabase identity provider API calls with standard error translation.
 */
export async function identityCall<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable'); }
}

/**
 * Validates an access token and resolves the authenticated subject's unique user ID.
 */
export async function verifiedIdentity(identity: IdentityProvider, token: string) {
  const id = await identityCall(() => identity.verify(token));
  if (id !== null && !uuid.safeParse(id).success) throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable');
  return id;
}

function readSession(session: Session | null, error: AuthError | null): IdentitySession | null {
  if (error) {
    if (error.status === 429) throw new ApiError(429, 'AUTH_RATE_LIMITED', 'Too many authentication attempts; try again later');
    if (!error.status || error.status >= 500) throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable');
    return null;
  }
  return session ? { userId: session.user.id, accessToken: session.access_token, refreshToken: session.refresh_token, expiresAt: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in, tokenType: 'bearer' } : null;
}

/**
 * Identity provider implementation interfacing Supabase GoTrue authentication service.
 */
export function supabaseIdentity(url: string, serviceKey: string, redirectTo: string): IdentityProvider {
  const options = {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) },
  };
  const admin = createClient(url, serviceKey, options);
  return {
    async signIn(email, password) {
      // A per-call client prevents concurrent user sessions from replacing the admin identity.
      const { data, error } = await createClient(url, serviceKey, options).auth.signInWithPassword({ email, password });
      return readSession(data.session, error);
    },
    async refresh(refreshToken) {
      const { data, error } = await createClient(url, serviceKey, options).auth.refreshSession({ refresh_token: refreshToken });
      return readSession(data.session, error);
    },
    async signOut(accessToken) {
      const { error } = await admin.auth.admin.signOut(accessToken, 'local');
      if (error && ![401, 403, 404].includes(error.status ?? 0)) throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Unable to end the authentication session');
    },
    async verify(token) {
      const { data, error } = await admin.auth.getUser(token);
      if (error) {
        if (error.status === 429) throw new ApiError(429, 'AUTH_RATE_LIMITED', 'Too many authentication attempts; try again later');
        if (!error.status || error.status >= 500) throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable');
        return null;
      }
      return data.user?.id ?? null;
    },
    async invite(email) {
      // Recover an identity left by a previous attempt whose database transaction failed.
      // Access is granted only by the explicit authorized invitation and Client ID below.
      for (let page = 1; ; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw new ApiError(503, 'INVITATION_UNAVAILABLE', 'Unable to check invitation identity');
        const existing = data.users.find(user => user.email?.toLowerCase() === email);
        if (existing) return existing.id;
        if (data.users.length < 1000) break;
      }
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
      if (error || !data.user) throw new ApiError(503, 'INVITATION_UNAVAILABLE', 'Unable to send invitation; retry with the same idempotency key');
      return data.user.id;
    },
  };
}
