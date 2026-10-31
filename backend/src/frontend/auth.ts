import { createBrowserClient } from '@supabase/ssr';

/** Browser-only helper for Antigravity's Vite app. No backend secrets belong here. */
export function createBrowserAuth(url: string, publishableKey: string) {
  const supabase = createBrowserClient(url, publishableKey);
  return {
    supabase,
    signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
    setPassword: (password: string) => supabase.auth.updateUser({ password }),
    acceptInvitation: (tokenHash: string) => supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' }),
    exchangeCode: (code: string) => supabase.auth.exchangeCodeForSession(code),
    recoverPassword: (email: string, redirectTo: string) => supabase.auth.resetPasswordForEmail(email, { redirectTo }),
    signOut: () => supabase.auth.signOut(),
    async accessToken() {
      // SDK refreshes sessions automatically. Express independently validates the token and profile.
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session?.access_token ?? null;
    },
  };
}
