/**
 * =============================================================================
 * File: TopHeader.tsx
 * Module: Layout Architecture Component
 * =============================================================================
 * Structural frame component (TopHeader) managing navigation sidebars, top headers, user avatars, and responsive layout wrapping.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

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
  Sliders,
  Compass
} from 'lucide-react';
import { Wedding } from '../../types';
import { isDemoModeActive } from '../../services/api';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { useAuth, AppRole, PortalType } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';

export interface TopHeaderProps {
  currentWedding: Wedding | null;
  weddingsList: Wedding[];
  onSelectWedding: (wedding: Wedding) => void;
  onResetDemoData: () => void;
  onViewShowcase?: () => void;
  activeLateCount?: number;
  openIncidentsCount?: number;
  onOpenMobileMenu?: () => void;
  isBackendConnected?: boolean;
}

/**
 * TopHeader component
 *
 * Top navigation header displaying active wedding selector, user badge, and portal switchers.
 */
export const TopHeader: React.FC<TopHeaderProps> = ({
  currentWedding,
  weddingsList,
  onSelectWedding,
  onResetDemoData,
  onViewShowcase,
  activeLateCount = 0,
  openIncidentsCount = 0,
  onOpenMobileMenu,
  isBackendConnected = false
}) => {
  const { user, role, portal, switchRole, switchPortal, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-[#0D1B2A] border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Left: Mobile Menu Toggle + Streamlined Active Event Selector */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Active Wedding Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[#FDFBF7] dark:bg-[#111D2E] hover:border-[#C5A059]/60 hover:bg-[#F5F1E8]/40 dark:hover:bg-[#152338] transition-all text-left group shadow-2xs"
          >
            <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 leading-none">
                Active Wedding
              </div>
              <div className="text-xs font-bold text-[#0D1B2A] dark:text-[#FDFBF7] group-hover:text-[#C5A059] transition-colors flex items-center gap-1.5 mt-0.5">
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {currentWedding?.coupleNames || 'No Wedding Selected'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#C5A059] shrink-0" />
              </div>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#0D1B2A] rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Operational Context
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {weddingsList.map(w => {
                  const isSelected = w.id === currentWedding?.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        onSelectWedding(w);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#F5F1E8] font-bold text-[#0D1B2A]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{w.coupleNames}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[170px]">{w.location}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Clean Date & Location Tag (Desktop Only) */}
        {currentWedding && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 pl-2 border-l border-slate-200">
            <span className="font-medium text-slate-700">{currentWedding.weddingDate}</span>
            <span>•</span>
            <span className="truncate max-w-[180px]">{currentWedding.location.split(',')[0]}</span>
          </div>
        )}
      </div>

      {/* Right Controls: Telemetry Dot + Late Alert + User Menu */}
      <div className="flex items-center gap-3">
        {/* Environment & Backend Telemetry Indicator */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isBackendConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : isDemoModeActive()
              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendConnected
                ? 'bg-emerald-500 ring-2 ring-emerald-200'
                : isDemoModeActive()
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
          <span className="tracking-wide uppercase text-[9px] font-bold">
            {isBackendConnected ? 'API Live' : isDemoModeActive() ? 'Demo Sandbox' : 'API Offline'}
          </span>
        </div>

        {/* Active Late Arrival Badge */}
        {activeLateCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>{activeLateCount} Late</span>
          </div>
        )}

        {/* Light / Dark Mode Palace Switcher */}
        <ThemeToggle variant="button" />

        {/* User Profile & Portal Switcher Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-white hover:border-[#C5A059]/60 transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0D1B2A] text-[#DFCA9B] font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.displayName ? user.displayName.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block text-left pr-1">
              <div className="text-xs font-bold text-[#0D1B2A] group-hover:text-[#C5A059] leading-tight transition-colors">
                {user?.displayName || 'Active User'}
              </div>
              <div className="text-[10px] text-slate-400 capitalize leading-tight">
                {role.toLowerCase()}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#C5A059]" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0D1B2A] rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 py-2.5 px-2 z-50 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
              {/* User Overview */}
              <div className="px-2 pb-2 border-b border-slate-100">
                <div className="font-bold text-xs text-[#0D1B2A]">{user?.displayName}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5F1E8] text-[#C5A059] border border-[#C5A059]/30 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{role} · {portal} Portal</span>
                </div>
              </div>

              {/* Quick Portal Switcher (For testing - Agency Internal Staff Only) */}
              {(role === 'FOUNDER' || role === 'PLANNER' || role === 'COORDINATOR' || role === 'FINANCE') && (
                <>
              <div className="px-2 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Test Dedicated Portals:
                </span>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold">
                  <button
                    onClick={() => {
                      switchPortal('AGENCY');
                      setUserMenuOpen(false);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center transition-colors cursor-pointer ${
                      portal === 'AGENCY'
                        ? 'bg-[#0D1B2A] text-[#C5A059]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Building className="w-3 h-3 mx-auto mb-0.5" />
                    <span>Agency</span>
                  </button>
                  <button
                    onClick={() => {
                      switchPortal('VENDOR');
                      setUserMenuOpen(false);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center transition-colors cursor-pointer ${
                      portal === 'VENDOR'
                        ? 'bg-[#0D1B2A] text-[#C5A059]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Store className="w-3 h-3 mx-auto mb-0.5" />
                    <span>Vendor</span>
                  </button>
                  <button
                    onClick={() => {
                      switchPortal('CLIENT');
                      setUserMenuOpen(false);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center transition-colors cursor-pointer ${
                      portal === 'CLIENT'
                        ? 'bg-[#0D1B2A] text-[#C5A059]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
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
                </>
              )}

              {/* Actions: Landing Page, Reset Demo & Sign Out */}
              <div className="border-t border-slate-100 pt-2 space-y-1">
                {onViewShowcase && (
                  <button
                    onClick={() => {
                      onViewShowcase();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left text-xs font-semibold text-[#C5A059] hover:bg-[#F5F1E8] px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>View Public Landing Page</span>
                  </button>
                )}

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
