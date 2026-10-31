/**
 * =============================================================================
 * THE ROYAL KNOT - Browser Authentication Client Helper
 * =============================================================================
 * Lightweight client-side authentication utility for browser environments.
 * Manages Supabase sessions, token retrieval, and password recovery.
 * Note: Never expose backend service role secrets here; uses public keys only.
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates browser-scoped authentication methods wrapping Supabase GoTrue client.
 *
 * @param url - Supabase project URL
 * @param publishableKey - Supabase public/anonymous API key
 */
export function createBrowserAuth(url: string, publishableKey: string) {
  // Initialize Supabase browser client instance
  const supabase = createBrowserClient(url, publishableKey);

  return {
    /** Underlying Supabase browser client */
    supabase,

    /**
     * Authenticates a user using email and password.
     * @param email - User's registered email
     * @param password - Account passphrase
     */
    signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),

    /**
     * Updates the password for the current authenticated user.
     * @param password - New password string
     */
    setPassword: (password: string) => supabase.auth.updateUser({ password }),

    /**
     * Verifies an invitation OTP token hash to activate a new team account.
     * @param tokenHash - Verification token hash from invite email
     */
    acceptInvitation: (tokenHash: string) => supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' }),

    /**
     * Exchanges an authorization code for an active session.
     * @param code - Authorization code
     */
    exchangeCode: (code: string) => supabase.auth.exchangeCodeForSession(code),

    /**
     * Dispatches a password recovery email with return redirect URL.
     * @param email - Target user email
     * @param redirectTo - Return frontend URL
     */
    recoverPassword: (email: string, redirectTo: string) => supabase.auth.resetPasswordForEmail(email, { redirectTo }),

    /**
     * Signs out the current user session and clears browser auth cookies/storage.
     */
    signOut: () => supabase.auth.signOut(),

    /**
     * Retrieves the active access token, refreshing if needed.
     * The Express backend independently validates and verifies this token.
     */
    async accessToken() {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session?.access_token ?? null;
    },
  };
}
