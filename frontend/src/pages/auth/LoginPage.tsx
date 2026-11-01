/**
 * =============================================================================
 * File: LoginPage.tsx
 * Module: Authentication & Identity Page
 * =============================================================================
 * Delivers full-scale wedding planning and coordination workspace for LoginPage, supporting real-time data inspection, filtering, and reporting.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState, useMemo } from 'react';
import { useAuth, DEMO_PROFILES, AppRole, PortalType, AuthUser } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  Users,
  Search,
  X,
  Building,
  Heart,
  Briefcase,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { RoyalLogo } from '../../components/common/RoyalLogo';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { INITIAL_VENDOR_PROFILES, INITIAL_WEDDINGS } from '../../services/mockData';

interface LoginPageProps {
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
  onNavigateToInvite?: (token: string) => void;
  onBackToLanding?: () => void;
}

interface DirectoryAccount {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  portal: PortalType;
  categoryOrVenue: string;
  badgeType: 'STAFF' | 'VENDOR' | 'CLIENT';
}

/**
 * LoginPage component
 *
 * Authentication screen supporting credentials login, quick role switchers,
 * and a complete searchable directory for all 440+ clients, vendors, and staff.
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

  // Account directory browser state
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [browserSearch, setBrowserSearch] = useState('');
  const [browserFilter, setBrowserFilter] = useState<'ALL' | 'CLIENT' | 'VENDOR' | 'STAFF'>('ALL');

  // Build the complete list of 440+ accounts (Clients, Vendors, Staff)
  const allAccounts: DirectoryAccount[] = useMemo(() => {
    const list: DirectoryAccount[] = [];

    // 1. Staff Accounts (Presets + Managed in LocalStorage)
    Object.entries(DEMO_PROFILES).forEach(([r, p]) => {
      list.push({
        id: p.id,
        name: p.displayName || p.name || r,
        email: p.email,
        role: r as AppRole,
        portal: 'AGENCY',
        categoryOrVenue: `Official ${r.toLowerCase()} persona`,
        badgeType: 'STAFF'
      });
    });

    try {
      const raw = localStorage.getItem('TRK_managed_users');
      if (raw) {
        const managed: AuthUser[] = JSON.parse(raw);
        managed.forEach(m => {
          if (!list.some(existing => existing.email.toLowerCase() === m.email.toLowerCase())) {
            list.push({
              id: m.id,
              name: m.displayName || m.email,
              email: m.email,
              role: m.role,
              portal: 'AGENCY',
              categoryOrVenue: 'Invited Operations Team Member',
              badgeType: 'STAFF'
            });
          }
        });
      }
    } catch {}

    // 2. Certified Vendor Accounts (210+ Partners)
    try {
      const rawVendors = localStorage.getItem('TRK_vendor_profiles');
      const vendorsList: any[] = rawVendors ? JSON.parse(rawVendors) : INITIAL_VENDOR_PROFILES;
      vendorsList.forEach(v => {
        list.push({
          id: v.id,
          name: v.name,
          email: v.email,
          role: 'VENDOR',
          portal: 'VENDOR',
          categoryOrVenue: `${v.category || 'Vendor'} · ${v.city || 'Rajasthan'}`,
          badgeType: 'VENDOR'
        });
      });
    } catch {}

    // 3. Royal Client Accounts (205+ Weddings)
    try {
      const rawWeddings = localStorage.getItem('TRK_weddings');
      const weddingsList: any[] = rawWeddings ? JSON.parse(rawWeddings) : INITIAL_WEDDINGS;
      weddingsList.forEach(w => {
        const clientMail = w.clientEmail || `client.${w.id.replace('wed-', '')}@royalwedding.com`;
        list.push({
          id: `client-${w.id}`,
          name: w.coupleNames,
          email: clientMail,
          role: 'CLIENT',
          portal: 'CLIENT',
          categoryOrVenue: w.location || 'Heritage Palace Destination',
          badgeType: 'CLIENT'
        });
      });
    } catch {}

    return list;
  }, []);

  // Filter accounts by search query and category tab
  const filteredAccounts = useMemo(() => {
    let result = allAccounts;

    if (browserFilter === 'CLIENT') {
      result = result.filter(a => a.badgeType === 'CLIENT');
    } else if (browserFilter === 'VENDOR') {
      result = result.filter(a => a.badgeType === 'VENDOR');
    } else if (browserFilter === 'STAFF') {
      result = result.filter(a => a.badgeType === 'STAFF');
    }

    if (browserSearch.trim()) {
      const q = browserSearch.trim().toLowerCase();
      result = result.filter(
        a =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.categoryOrVenue.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allAccounts, browserFilter, browserSearch]);

  const handleRolePreset = (roleKey: AppRole) => {
    setSelectedPresetRole(roleKey);
    const profile = DEMO_PROFILES[roleKey];
    if (profile) {
      setEmail(profile.email);
      setPassword('royalKnot2026!');
      setErrorMessage(null);
    }
  };

  const handleSelectDirectoryAccount = async (account: DirectoryAccount) => {
    setEmail(account.email);
    setPassword('royalKnot2026!');
    setIsBrowserOpen(false);
    setErrorMessage(null);

    try {
      await login(account.email, 'royalKnot2026!', account.portal);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate into selected account.');
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
    <div className="min-h-screen w-full bg-[#FDFBF7] dark:bg-[#070E18] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative transition-colors duration-200">
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
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-[#0D1B2A] dark:hover:text-[#FDFBF7] font-semibold transition-colors py-1 px-3 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 cursor-pointer"
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
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A] dark:text-[#FDFBF7]">
            The Royal Knot
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">
            Luxury Wedding Operations & Stakeholder Portals
          </p>
        </div>

        {/* Quick Role Preset Picker (For testing & evaluation) */}
        <div className="bg-white dark:bg-[#111D2E] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block px-1">
            Fast Role Evaluation Switcher:
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {(['FOUNDER', 'PLANNER', 'COORDINATOR', 'FINANCE', 'VENDOR', 'CLIENT'] as AppRole[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => handleRolePreset(r)}
                className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all cursor-pointer ${
                  selectedPresetRole === r
                    ? 'bg-[#0D1B2A] text-[#C5A059] dark:bg-[#C5A059] dark:text-[#0D1B2A] shadow-xs'
                    : 'bg-slate-50 dark:bg-[#152338] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1b2d49]'
                }`}
              >
                {r === 'CLIENT' ? 'Couple' : r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Browse All 440+ Accounts Button */}
          <button
            type="button"
            onClick={() => setIsBrowserOpen(true)}
            className="w-full mt-2 py-2.5 px-3 rounded-xl border border-[#C5A059]/40 bg-[#FDFBF7] dark:bg-[#132238] hover:bg-[#F5F1E8] dark:hover:bg-[#1a2d4a] text-xs font-bold text-[#0D1B2A] dark:text-[#DFCA9B] flex items-center justify-between transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform" />
              <span>Browse & Login to All 440+ Accounts</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C5A059]/15 text-[#C5A059] font-bold">
              205 Clients · 210 Vendors
            </span>
          </button>
        </div>

        {/* Primary Login Card */}
        <div className="bg-white dark:bg-[#111D2E] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2 animate-shake">
              <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                  placeholder="name@theroyalknot.com or client.001@royalwedding.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent text-xs text-[#0D1B2A] dark:text-[#F1F5F9] bg-slate-50/50 dark:bg-[#152338]"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                  placeholder="royalKnot2026!"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent text-xs text-[#0D1B2A] dark:text-[#F1F5F9] bg-slate-50/50 dark:bg-[#152338]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                Demo Passphrase: <code className="text-[#C5A059] font-mono font-semibold">royalKnot2026!</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#0D1B2A] dark:bg-[#C5A059] text-[#DFCA9B] dark:text-[#0D1B2A] font-bold text-xs uppercase tracking-wider hover:bg-slate-900 dark:hover:bg-[#DFCA9B] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#DFCA9B] dark:border-[#0D1B2A] border-t-transparent rounded-full animate-spin" />
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
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => onNavigateToInvite('inv-demo-2026-partner')}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#0D1B2A] dark:hover:text-white font-medium cursor-pointer"
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

      {/* Account Directory Modal (Browse & 1-Click Login for all 440+ Accounts) */}
      {isBrowserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-lg text-[#0D1B2A] dark:text-[#FDFBF7] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <span>Master Account Directory</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select any certified vendor, royal client couple, or staff member to authenticate instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBrowserOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-[#111D2E]">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setBrowserFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                    browserFilter === 'ALL'
                      ? 'bg-[#0D1B2A] dark:bg-[#C5A059] text-[#DFCA9B] dark:text-[#0D1B2A] shadow-xs'
                      : 'bg-white dark:bg-[#152338] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  All ({allAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBrowserFilter('CLIENT')}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                    browserFilter === 'CLIENT'
                      ? 'bg-[#0D1B2A] dark:bg-[#C5A059] text-[#DFCA9B] dark:text-[#0D1B2A] shadow-xs'
                      : 'bg-white dark:bg-[#152338] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Couples ({allAccounts.filter(a => a.badgeType === 'CLIENT').length})
                </button>
                <button
                  type="button"
                  onClick={() => setBrowserFilter('VENDOR')}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                    browserFilter === 'VENDOR'
                      ? 'bg-[#0D1B2A] dark:bg-[#C5A059] text-[#DFCA9B] dark:text-[#0D1B2A] shadow-xs'
                      : 'bg-white dark:bg-[#152338] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Vendors ({allAccounts.filter(a => a.badgeType === 'VENDOR').length})
                </button>
                <button
                  type="button"
                  onClick={() => setBrowserFilter('STAFF')}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                    browserFilter === 'STAFF'
                      ? 'bg-[#0D1B2A] dark:bg-[#C5A059] text-[#DFCA9B] dark:text-[#0D1B2A] shadow-xs'
                      : 'bg-white dark:bg-[#152338] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Staff ({allAccounts.filter(a => a.badgeType === 'STAFF').length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={browserSearch}
                  onChange={e => setBrowserSearch(e.target.value)}
                  placeholder="Search by name, email, wedding, or category..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#132238] text-xs text-[#0D1B2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            {/* Account List (Scrollable) */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2">
              {filteredAccounts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No accounts found matching "{browserSearch}".
                </div>
              ) : (
                filteredAccounts.map(account => (
                  <div
                    key={account.id}
                    className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#111D2E] transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#F5F1E8] dark:bg-[#152338] text-[#C5A059] font-bold text-xs flex items-center justify-center shrink-0 border border-[#C5A059]/20">
                        {account.badgeType === 'CLIENT' && <Heart className="w-4 h-4 text-rose-500" />}
                        {account.badgeType === 'VENDOR' && <Building className="w-4 h-4 text-[#C5A059]" />}
                        {account.badgeType === 'STAFF' && <Briefcase className="w-4 h-4 text-[#1B3B6F] dark:text-[#DFCA9B]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0D1B2A] dark:text-[#FDFBF7] truncate">
                            {account.name}
                          </span>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
                              account.badgeType === 'CLIENT'
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                : account.badgeType === 'VENDOR'
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                            }`}
                          >
                            {account.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                          {account.email} · <span className="text-slate-500">{account.categoryOrVenue}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectDirectoryAccount(account)}
                      className="px-3 py-1.5 rounded-xl bg-[#0D1B2A] dark:bg-[#C5A059] text-[#DFCA9B] dark:text-[#0D1B2A] font-bold text-xs hover:bg-slate-800 dark:hover:bg-[#DFCA9B] transition-all shrink-0 cursor-pointer shadow-xs"
                    >
                      Log In &rarr;
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111D2E] flex items-center justify-between text-[11px] text-slate-400">
              <span>Showing {filteredAccounts.length} of {allAccounts.length} accounts</span>
              <span>Passphrase: <strong className="text-[#C5A059] font-mono">royalKnot2026!</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
