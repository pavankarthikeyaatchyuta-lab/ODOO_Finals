import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { RoyalLogo } from '../common/RoyalLogo';
import {
  Heart,
  Clock,
  FileCheck2,
  CreditCard,
  LogOut,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  User,
  Users,
  Menu,
  X,
  Shield,
  Building
} from 'lucide-react';

export type ClientTabKey = 'overview' | 'schedule' | 'documents' | 'payments';

interface ClientPortalLayoutProps {
  currentTab: ClientTabKey;
  onSelectTab: (tab: ClientTabKey) => void;
  children: React.ReactNode;
}

/**
 * ClientPortalLayout component
 *
 * Dedicated bridal couple portal layout with header tabs (Overview, Schedule, Documents, Payments).
 */
export const ClientPortalLayout: React.FC<ClientPortalLayoutProps> = ({
  currentTab,
  onSelectTab,
  children
}) => {
  const { user, logout, switchPortal } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Check if current user is a restricted family member
  const isFamily = user?.role === 'FAMILY' || user?.isFamilyMember;

  // Navigation items: Family members do NOT see documents or payments
  const navItems = [
    { key: 'overview' as ClientTabKey, label: 'Celebration Overview', icon: Sparkles },
    { key: 'schedule' as ClientTabKey, label: 'Ceremony Schedule', icon: Clock },
    ...(!isFamily
      ? [
          { key: 'documents' as ClientTabKey, label: 'Agreements & Layouts', icon: FileCheck2 },
          { key: 'payments' as ClientTabKey, label: 'Payment Milestones', icon: CreditCard }
        ]
      : [])
  ];

  const handleSelectTab = (tab: ClientTabKey) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#FDFBF7] text-[#0D1B2A] overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Vertical Sidebar (Matching Agency Navigation Standard) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0D1B2A] text-white flex flex-col h-full border-r border-[#1B3B6F]/40 shadow-xl lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-[#1B3B6F]/40 flex items-center justify-between bg-[#080E17]/60">
          <div className="flex items-center gap-3">
            <RoyalLogo size="sm" />
            <div>
              <h1 className="font-serif font-bold text-sm tracking-wider text-[#FDFBF7] leading-none">
                THE ROYAL KNOT
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-[#C5A059] font-medium block mt-1">
                {isFamily ? 'Family Coordinator' : 'Couple Suite'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Scope Banner */}
        <div className="px-5 py-2.5 bg-[#142334] border-b border-[#1B3B6F]/30 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Scope:</span>
          </span>
          <span className="font-mono font-bold text-[#DFCA9B] bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#C5A059]/30">
            {isFamily ? 'FAMILY' : 'CLIENT'}
          </span>
        </div>

        {/* Navigation Items (Vertical Stack) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => handleSelectTab(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-linear-to-r from-[#1B3B6F] to-[#254B8C] text-white shadow-md shadow-[#1B3B6F]/40 border-l-3 border-[#C5A059]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#DFCA9B]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Sidebar Action: Sign Out */}
        <div className="p-3 border-t border-[#1B3B6F]/40 bg-[#080E17]/40 space-y-2">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
          <div className="text-[10px] text-slate-500 text-center tracking-wider uppercase">
            Couple Portal · Safe & Encrypted
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header (Matching Agency TopHeader Standard) */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Active Wedding Context Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-[#FDFBF7]">
              <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 leading-none">
                  Celebration Event
                </div>
                <div className="text-xs font-bold text-[#0D1B2A] mt-0.5">
                  Rahul & Ananya · Taj Lake Palace, Udaipur
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              <span className="tracking-wide uppercase text-[9px] font-bold">Portal Live</span>
            </div>

            {/* User Avatar Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-white hover:border-[#C5A059]/60 transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#0D1B2A] text-[#DFCA9B] font-bold text-xs flex items-center justify-center shadow-xs">
                  {isFamily ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="hidden md:block text-left pr-1">
                  <div className="text-xs font-bold text-[#0D1B2A] group-hover:text-[#C5A059] leading-tight transition-colors">
                    {user?.name || (isFamily ? 'Vikram Singh' : 'Rahul Sharma')}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize leading-tight">
                    {isFamily ? 'Family Access' : 'Couple Suite'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#C5A059]" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2.5 px-2 z-50 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 pb-2 border-b border-slate-100">
                    <div className="font-bold text-xs text-[#0D1B2A]">{user?.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5F1E8] text-[#C5A059] border border-[#C5A059]/30 text-[10px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      <span>{isFamily ? 'Family Coordinator' : 'Couple Account'}</span>
                    </div>
                  </div>

                  <div className="px-2 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Switch Role Portal:
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-semibold">
                      <button
                        onClick={() => {
                          switchPortal('AGENCY');
                          setIsProfileOpen(false);
                        }}
                        className="py-1.5 px-2 rounded-lg text-center bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                      >
                        <Building className="w-3 h-3 mx-auto mb-0.5" />
                        <span>Agency</span>
                      </button>
                      <button
                        onClick={() => {
                          switchPortal('VENDOR');
                          setIsProfileOpen(false);
                        }}
                        className="py-1.5 px-2 rounded-lg text-center bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                      >
                        <Heart className="w-3 h-3 mx-auto mb-0.5" />
                        <span>Vendor</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Family Privacy Banner */}
        {isFamily && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-center text-xs text-blue-800 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Family Member Mode:</strong> Financial contracts, billing statements, and vendor negotiations are private to the couple. You have full access to ceremony schedules and hospitality updates.
            </span>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentTab}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
