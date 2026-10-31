/**
 * =============================================================================
 * File: LoginPage.tsx
 * Module: Authentication & Identity Page
 * =============================================================================
 * Provides user interface, credential validation, and role-based redirect flows for the LoginPage screen.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState } from 'react';
import { useAuth, DEMO_PROFILES, AppRole } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { RoyalLogo } from '../../components/common/RoyalLogo';
import { ThemeToggle } from '../../components/common/ThemeToggle';

interface LoginPageProps {
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
  onNavigateToInvite?: (token: string) => void;
  onBackToLanding?: () => void;
}

/**
 * LoginPage component
 *
 * Authentication screen supporting credentials login and quick role preview switchers.
 */
export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToForgotPassword,
  onNavigateToInvite,
  onBackToLanding
}) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPresetRole, setSelectedPresetRole] = useState<AppRole | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRolePreset = (roleKey: AppRole) => {
    setSelectedPresetRole(roleKey);
    const profile = DEMO_PROFILES[roleKey];
    if (profile) {
      setEmail(profile.email);
      setPassword('');
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid official email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      const success = await login(email, password);
      if (!success) {
        setErrorMessage('Authentication rejected. Please check credentials or select a verified demo persona.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'A network error occurred while connecting to the authorization service.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative">
      {/* Theme Toggle Pill (Top Right) */}
      <div className="absolute top-5 right-5 z-30">
        <ThemeToggle variant="pill" />
      </div>
      {/* Background Decorative Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#C5A059]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#1B3B6F]/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Back to Landing link if provided */}
        {onBackToLanding && (
          <div className="text-center">
            <button
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0D1B2A] font-semibold transition-colors py-1 px-3 rounded-full hover:bg-slate-200/50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Showcase & Landing Page</span>
            </button>
          </div>
        )}

        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <RoyalLogo size="lg" />
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A]">
            The Royal Knot
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">
            Luxury Wedding Operations & Stakeholder Portals
          </p>
        </div>

        {/* Quick Role Preset Picker (For testing & evaluation) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
            Fast Role Evaluation Switcher:
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleRolePreset('FOUNDER')}
              className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all ${
                selectedPresetRole === 'FOUNDER'
                  ? 'bg-[#0D1B2A] text-[#C5A059] shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Founder
            </button>
            <button
              type="button"
              onClick={() => handleRolePreset('PLANNER')}
              className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all ${
                selectedPresetRole === 'PLANNER'
                  ? 'bg-[#0D1B2A] text-[#C5A059] shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Planner
            </button>
            <button
              type="button"
              onClick={() => handleRolePreset('COORDINATOR')}
              className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all ${
                selectedPresetRole === 'COORDINATOR'
                  ? 'bg-[#0D1B2A] text-[#C5A059] shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Coordinator
            </button>
            <button
              type="button"
              onClick={() => handleRolePreset('FINANCE')}
              className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all ${
                selectedPresetRole === 'FINANCE'
                  ? 'bg-[#0D1B2A] text-[#C5A059] shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Finance
            </button>
            <button
              type="button"
              onClick={() => handleRolePreset('VENDOR')}
              className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all ${
                selectedPresetRole === 'VENDOR'
                  ? 'bg-[#0D1B2A] text-[#C5A059] shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Vendor
            </button>
            <button
              type="button"
              onClick={() => handleRolePreset('CLIENT')}
              className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all ${
                selectedPresetRole === 'CLIENT'
                  ? 'bg-[#0D1B2A] text-[#C5A059] shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Couple
            </button>
          </div>
        </div>

        {/* Primary Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-shake">
              <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@theroyalknot.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent text-xs text-[#0D1B2A] bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Security Passphrase
                </label>
                {onNavigateToForgotPassword && (
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-[11px] text-[#C5A059] hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent text-xs text-[#0D1B2A] bg-slate-50/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#0D1B2A] text-[#DFCA9B] font-bold text-xs uppercase tracking-wider hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#DFCA9B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Invitation code link */}
          {onNavigateToInvite && (
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => onNavigateToInvite('inv-demo-2026-partner')}
                className="text-xs text-slate-500 hover:text-[#0D1B2A] font-medium"
              >
                Received a partner invitation link? <strong className="text-[#C5A059] underline">Accept Invite</strong>
              </button>
            </div>
          )}
        </div>

        {/* Security & Confidentiality Footer */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict Role-Based Confidentiality Active</span>
          </div>
          <p className="text-[10px] text-slate-400">
            The Royal Knot Luxury Wedding Management · Version 2.0.0
          </p>
        </div>
      </div>
    </div>
  );
};
