import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Crown,
  LayoutDashboard,
  Clock,
  FileSpreadsheet,
  AlertTriangle,
  LogOut,
  ChevronDown,
  Building2,
  CheckCircle2,
  Bell
} from 'lucide-react';

export type VendorTabKey = 'overview' | 'schedule' | 'invoices' | 'issue';

interface VendorPortalLayoutProps {
  currentTab: VendorTabKey;
  onSelectTab: (tab: VendorTabKey) => void;
  pendingAckCount?: number;
  children: React.ReactNode;
}

export const VendorPortalLayout: React.FC<VendorPortalLayoutProps> = ({
  currentTab,
  onSelectTab,
  pendingAckCount = 0,
  children
}) => {
  const { user, logout, switchPortal } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { key: 'overview' as VendorTabKey, label: 'Overview & Call-Times', icon: LayoutDashboard },
    {
      key: 'schedule' as VendorTabKey,
      label: 'Schedule & Acknowledgements',
      icon: Clock,
      badge: pendingAckCount > 0 ? pendingAckCount : undefined
    },
    { key: 'invoices' as VendorTabKey, label: 'Invoices & Payouts', icon: FileSpreadsheet },
    { key: 'issue' as VendorTabKey, label: 'Report Incident', icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0D1B2A] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D1B2A] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shadow-xs">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm tracking-wide text-[#0D1B2A]">
                  THE ROYAL KNOT
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F5F1E8] text-[#C5A059] border border-[#C5A059]/30">
                  Vendor Partner Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {user?.vendorCategory || 'Catering & Hospitality'} Partner
              </p>
            </div>
          </div>

          {/* Center Navigation for Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F5F1E8]/50 p-1 rounded-xl border border-slate-200/60">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelectTab(item.key)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-white text-[#0D1B2A] shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-[#0D1B2A] hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C5A059]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Partner Profile & Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#C5A059]/50 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5F1E8] border border-[#C5A059]/30 flex items-center justify-center font-bold text-xs text-[#C5A059]">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left pr-1">
                <div className="text-xs font-bold text-[#0D1B2A] leading-tight truncate max-w-[140px]">
                  {user?.name || 'SpiceHeaven Caterers'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Partner Account</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-[#0D1B2A]">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Royal Knot Vendor</span>
                  </div>
                </div>

                <div className="p-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
                    Portal Switcher (Test / Evaluation)
                  </p>
                  <button
                    onClick={() => {
                      switchPortal('AGENCY');
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-[#F5F1E8] transition-colors"
                  >
                    Switch to Agency Workspace
                  </button>
                  <button
                    onClick={() => {
                      switchPortal('CLIENT');
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-[#F5F1E8] transition-colors"
                  >
                    Switch to Couple Portal
                  </button>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden border-t border-slate-200/80 px-4 py-2 bg-slate-50 flex items-center justify-around overflow-x-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-semibold ${
                  isActive ? 'text-[#C5A059]' : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        The Royal Knot · Verified Vendor Partner Extranet · Strict Confidentiality Active
      </footer>
    </div>
  );
};
