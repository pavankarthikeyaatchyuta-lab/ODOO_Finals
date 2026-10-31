/**
 * =============================================================================
 * File: ForgotPasswordPage.tsx
 * Module: Authentication & Identity Page
 * =============================================================================
 * Provides user interface, credential validation, and role-based redirect flows for the ForgotPasswordPage screen.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState } from 'react';
import { Crown, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
  onNavigateToReset?: (token: string) => void;
}

/**
 * ForgotPasswordPage component
 *
 * Password recovery request screen.
 */
export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateToLogin,
  onNavigateToReset
}) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#0D1B2A] rounded-2xl border border-[#C5A059]/40 shadow-md flex items-center justify-center mx-auto">
            <Crown className="w-7 h-7 text-[#DFCA9B]" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-[#0D1B2A]">
            Reset Your Access Password
          </h1>
          <p className="text-xs text-slate-500">
            Enter your official address to receive a secure password recovery token.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl space-y-5">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                  Recovery Dispatch Transmitted
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  We have dispatched a verification link to <strong className="text-slate-800">{email}</strong>.
                </p>
              </div>

              {onNavigateToReset && (
                <button
                  type="button"
                  onClick={() => onNavigateToReset('tok-recovery-2026')}
                  className="w-full bg-[#C5A059] hover:bg-[#8E7341] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Proceed to Reset Password Page (Demo Token)
                </button>
              )}

              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto cursor-pointer pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Official Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@theroyalknot.com"
                    className="w-full text-xs font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Transmitting Token...' : 'Send Recovery Instructions'}</span>
                <ArrowRight className="w-4 h-4 text-[#DFCA9B]" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
