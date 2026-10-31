import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  MapPin,
  Users,
  ShieldCheck,
  Menu,
  ChevronDown,
  LogOut,
  User,
  Store,
  Heart,
  Building,
  Sparkles,
  Sliders
} from 'lucide-react';
import { Wedding } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { useAuth, AppRole, PortalType } from '../../context/AuthContext';

export interface TopHeaderProps {
  currentWedding: Wedding | null;
  weddingsList: Wedding[];
  onSelectWedding: (wedding: Wedding) => void;
  onResetDemoData: () => void;
  activeLateCount?: number;
  onOpenMobileMenu?: () => void;
  isBackendConnected?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentWedding,
  weddingsList,
  onSelectWedding,
  onResetDemoData,
  activeLateCount = 0,
  onOpenMobileMenu,
  isBackendConnected = false
}) => {
  const { user, role, portal, switchPortal, switchRole, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeColor = (r: AppRole) => {
    switch (r) {
      case 'FOUNDER':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'PLANNER':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'COORDINATOR':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'FINANCE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'VENDOR':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'CLIENT':
      case 'FAMILY':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Menu Trigger + Active Wedding Selector */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Essential Context: Active Event Selector */}
        {currentWedding ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden md:inline text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Active Event:
            </span>
            <select
              value={currentWedding.id}
              onChange={e => {
                const selected = weddingsList.find(w => w.id === e.target.value);
                if (selected) onSelectWedding(selected);
              }}
              className="text-xs sm:text-sm font-serif font-bold text-[#0D1B2A] bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C5A059] cursor-pointer truncate max-w-[200px] sm:max-w-xs"
            >
              {weddingsList.map(w => (
                <option key={w.id} value={w.id}>
                  {w.coupleNames} ({w.code})
                </option>
              ))}
            </select>

            {/* Quick Context Pill */}
            <span className="hidden xl:inline-flex items-center gap-1 text-xs text-slate-500 font-medium pl-2">
              <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
              {currentWedding.location.split(',')[0]}
            </span>
          </div>
        ) : (
          <div className="text-xs font-semibold text-slate-400">
            No active wedding selected
          </div>
        )}
      </div>

      {/* Right Controls: Minimalist, Non-Overcrowded */}
      <div className="flex items-center gap-3">
        {/* API Telemetry Dot */}
        <div
          className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full border bg-slate-50 border-slate-200"
          title={isBackendConnected ? 'Connected to Express Backend /api/v1' : 'Standalone Enterprise Dual-Mode Client'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-[#C5A059]'}`} />
          <span className="hidden sm:inline font-bold text-slate-600">
            {isBackendConnected ? 'API LIVE' : 'API READY'}
          </span>
        </div>

        {/* Operational Alert Pill */}
        {activeLateCount > 0 && (
          <div
            title={`${activeLateCount} delayed vendor arrival requires coordinator attention`}
            className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>{activeLateCount} Alert</span>
          </div>
        )}

        {/* User Profile & Portal Switcher Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#0D1B2A] text-[#DFCA9B] border border-[#C5A059]/40 flex items-center justify-center font-serif text-xs font-bold">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'TR'}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <span className="font-bold text-[#0D1B2A] block truncate max-w-[120px]">
                {user?.displayName || 'User'}
              </span>
              <span className={`inline-block text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(role)}`}>
                {role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3 space-y-3 z-50 animate-in fade-in duration-100">
              <div className="border-b border-slate-100 pb-2.5 px-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Signed in as
                </span>
                <p className="font-bold text-sm text-[#0D1B2A] truncate">{user?.displayName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1">
                  <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getRoleBadgeColor(role)}`}>
                    Role: {role}
                  </span>
                </div>
              </div>

              {/* Stakeholder Portal Switcher (For Evaluation & Demo) */}
              <div className="px-2 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Switch Active Portal:
                </span>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  <button
                    onClick={() => {
                      switchPortal('AGENCY');
                      setUserMenuOpen(false);
                    }}
                    className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      portal === 'AGENCY'
                        ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Building className="w-3 h-3 mx-auto mb-0.5 text-[#1B3B6F]" />
                    <span>Agency</span>
                  </button>

                  <button
                    onClick={() => {
                      switchPortal('VENDOR');
                      setUserMenuOpen(false);
                    }}
                    className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      portal === 'VENDOR'
                        ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Store className="w-3 h-3 mx-auto mb-0.5 text-amber-600" />
                    <span>Vendor</span>
                  </button>

                  <button
                    onClick={() => {
                      switchPortal('CLIENT');
                      setUserMenuOpen(false);
                    }}
                    className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      portal === 'CLIENT'
                        ? 'border-[#C5A059] bg-[#FDFBF7] font-bold text-[#0D1B2A]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Heart className="w-3 h-3 mx-auto mb-0.5 text-rose-500" />
                    <span>Couple</span>
                  </button>
                </div>
              </div>

              {/* Role Switcher (For internal testing) */}
              <div className="px-2 space-y-1 border-t border-slate-100 pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Test Internal Role:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {(['FOUNDER', 'PLANNER', 'COORDINATOR', 'FINANCE'] as AppRole[]).map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setUserMenuOpen(false);
                      }}
                      className={`px-2 py-1 rounded text-left transition-colors cursor-pointer ${
                        role === r ? 'bg-slate-100 font-bold text-[#0D1B2A]' : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      • {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions: Reset Demo & Sign Out */}
              <div className="border-t border-slate-100 pt-2 space-y-1">
                <button
                  onClick={() => {
                    onResetDemoData();
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left text-xs text-slate-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Demo Storage</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out of Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
