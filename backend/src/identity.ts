import { createClient } from '@supabase/supabase-js';
import { ApiError } from './errors.js';

export interface IdentityProvider {
  verify(token: string): Promise<string | null>;
  invite(email: string): Promise<string>;
}

export function supabaseIdentity(url: string, serviceKey: string, redirectTo: string): IdentityProvider {
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) },
  });
  return {
    async verify(token) {
      const { data, error } = await admin.auth.getUser(token);
      if (error) {
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
