/**
 * =============================================================================
 * File: InvitationAcceptPage.tsx
 * Module: Authentication & Identity Page
 * =============================================================================
 * Provides user interface, credential validation, and role-based redirect flows for the InvitationAcceptPage screen.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Crown, CheckCircle2, Lock, Mail, User, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

interface InvitationAcceptPageProps {
  token?: string;
  onNavigateToLogin: () => void;
}

/**
 * InvitationAcceptPage component
 *
 * Team member onboarding and invitation acceptance page.
 */
export const InvitationAcceptPage: React.FC<InvitationAcceptPageProps> = ({
  token = 'inv-demo-2026-partner',
  onNavigateToLogin
}) => {
  const { login } = useAuth();
  const [displayName, setDisplayName] = useState('Chef Vikramaditya');
  const [email] = useState('catering@spiceheaven.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreedTerms) {
      setError('Please agree to the destination operations and confidentiality protocol.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate backend acceptance & login
      await login(email, password, 'VENDOR');
    } catch (err: any) {
      setError(err.message || 'Invitation token expired or invalid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#0D1B2A] rounded-2xl border border-[#C5A059]/40 shadow-md flex items-center justify-center mx-auto">
            <Crown className="w-7 h-7 text-[#DFCA9B]" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-[#0D1B2A]">
            Official Stakeholder Invitation
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">
            The Royal Knot • Jagmandir & Rambagh Operations
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl space-y-5">
          {/* Verified Invitation Banner */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-emerald-950 block">Verified Invitation Token</span>
              <p className="text-emerald-800 mt-0.5">
                Invited by: <strong>Priya Mehra (Lead Luxury Director)</strong> • Assigned Role: <strong>Contracted Vendor (Catering Lead)</strong>
              </p>
              <span className="text-[10px] text-emerald-600 font-mono mt-1 block">Token ID: {token}</span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal / Commercial Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full text-xs font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designated Invitation Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full text-xs font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full text-xs font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full text-xs font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedTerms}
                onChange={e => setAgreedTerms(e.target.checked)}
                className="mt-0.5 rounded text-[#1B3B6F] focus:ring-[#C5A059] cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                I agree to The Royal Knot Confidentiality Agreement, digital agreement terms, and schedule change coordination protocol.
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Activating Portal...' : 'Activate & Enter Portal'}</span>
                <ArrowRight className="w-4 h-4 text-[#DFCA9B]" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
