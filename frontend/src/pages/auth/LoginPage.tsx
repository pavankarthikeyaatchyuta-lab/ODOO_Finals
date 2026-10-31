import React, { useState } from 'react';
import { useAuth, DEMO_PROFILES, AppRole } from '../../context/AuthContext';
import { Crown, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, Building, Store, Heart } from 'lucide-react';

interface LoginPageProps {
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
  onNavigateToInvite?: (token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToForgotPassword,
  onNavigateToInvite
}) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('founder@theroyalknot.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPresetRole, setSelectedPresetRole] = useState<AppRole>('FOUNDER');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRolePreset = (roleKey: AppRole) => {
    setSelectedPresetRole(roleKey);
    const profile = DEMO_PROFILES[roleKey];
    if (profile) {
      setEmail(profile.email);
      setPassword('royalKnot2026!');
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
        setErrorMessage('Authentication failed. Please verify your credentials or invitation status.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to authorization server. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#C5A059]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#1B3B6F]/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#0D1B2A] rounded-2xl border border-[#C5A059]/40 shadow-md flex items-center justify-center mx-auto">
            <Crown className="w-7 h-7 text-[#DFCA9B]" />
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
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedPresetRole === 'FOUNDER'
                  ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A] shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Building className="w-3.5 h-3.5 mx-auto mb-0.5 text-[#1B3B6F]" />
              <span className="text-[11px] block">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRolePreset('PLANNER')}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedPresetRole === 'PLANNER'
                  ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A] shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 mx-auto mb-0.5 text-[#C5A059]" />
              <span className="text-[11px] block">Planner</span>
            </button>

            <button
              type="button"
              onClick={() => handleRolePreset('COORDINATOR')}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedPresetRole === 'COORDINATOR'
                  ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A] shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-0.5 text-emerald-600" />
              <span className="text-[11px] block">Coord.</span>
            </button>

            <button
              type="button"
              onClick={() => handleRolePreset('FINANCE')}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedPresetRole === 'FINANCE'
                  ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A] shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span className="font-mono text-xs font-bold text-[#1B3B6F] block">₹</span>
              <span className="text-[11px] block">Finance</span>
            </button>

            <button
              type="button"
              onClick={() => handleRolePreset('VENDOR')}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedPresetRole === 'VENDOR'
                  ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A] shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Store className="w-3.5 h-3.5 mx-auto mb-0.5 text-amber-600" />
              <span className="text-[11px] block">Vendor</span>
            </button>

            <button
              type="button"
              onClick={() => handleRolePreset('CLIENT')}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedPresetRole === 'CLIENT'
                  ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A] shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Heart className="w-3.5 h-3.5 mx-auto mb-0.5 text-rose-500" />
              <span className="text-[11px] block">Couple</span>
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-serif font-bold text-lg text-[#0D1B2A]">
              Secure Stakeholder Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Access your personalized management portal with verified permissions.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium animate-in fade-in">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official Email Address
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

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                {onNavigateToForgotPassword && (
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-[11px] font-semibold text-[#1B3B6F] hover:text-[#0D1B2A] cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs font-medium pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4 text-[#DFCA9B]" />
            </button>
          </form>

          {/* Invitation Acceptance Link */}
          {onNavigateToInvite && (
            <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
              Have an official invitation link?{' '}
              <button
                type="button"
                onClick={() => onNavigateToInvite('inv-demo-2026-partner')}
                className="font-semibold text-[#C5A059] hover:underline cursor-pointer ml-1"
              >
                Accept Invitation
              </button>
            </div>
          )}
        </div>

        <p className="text-[11px] text-center text-slate-400">
          Governed by strict role-based access control and Supabase authentication.
        </p>
      </div>
    </div>
  );
};
