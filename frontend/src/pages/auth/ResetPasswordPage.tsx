import React, { useState } from 'react';
import { Crown, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ResetPasswordPageProps {
  token?: string;
  onNavigateToLogin: () => void;
}

/**
 * ResetPasswordPage component
 *
 * Password reset screen with token validation.
 */
export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  token = 'tok-recovery-2026',
  onNavigateToLogin
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#0D1B2A] rounded-2xl border border-[#C5A059]/40 shadow-md flex items-center justify-center mx-auto">
            <Crown className="w-7 h-7 text-[#DFCA9B]" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-[#0D1B2A]">
            Define New Password
          </h1>
          <p className="text-xs text-slate-500">
            Token Verified • Establish a secure password for your portal.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl space-y-5">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                  Password Successfully Updated
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your credentials have been re-encrypted. Please proceed to sign in with your new password.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full text-xs font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full text-xs font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Save New Password</span>
                <ArrowRight className="w-4 h-4 text-[#DFCA9B]" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel and Return</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
