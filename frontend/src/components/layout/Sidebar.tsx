import React from 'react';
import {
  LayoutDashboard,
  MessageSquareHeart,
  Users2,
  Crown,
  Store,
  FileSpreadsheet,
  CheckSquare,
  Radio,
  Coins,
  BarChart3,
  Sliders,
  Sparkles,
  X,
  Shield
} from 'lucide-react';
import { useAuth, AppRole } from '../../context/AuthContext';

export type NavItemKey =
  | 'overview'
  | 'enquiries'
  | 'clients'
  | 'weddings'
  | 'vendors'
  | 'quotations'
  | 'tasks'
  | 'command-centre'
  | 'finance'
  | 'reports'
  | 'settings';

export interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  activeLateCount?: number;
  openIncidentsCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeLateCount = 0,
  mobileOpen = false,
  onCloseMobile
}) => {
  const { role, user } = useAuth();

  const allNavItems: Array<{
    key: NavItemKey;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: 'crimson' | 'gold' | 'emerald';
  }> = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'enquiries', label: 'Enquiries', icon: MessageSquareHeart, badge: 3 },
    { key: 'clients', label: 'Clients', icon: Users2 },
    { key: 'weddings', label: 'Weddings', icon: Crown, badge: 25 },
    { key: 'vendors', label: 'Vendors', icon: Store },
    { key: 'quotations', label: 'Quotations', icon: FileSpreadsheet, badge: '3 RFQs', badgeColor: 'gold' },
    { key: 'tasks', label: 'Planning Tasks', icon: CheckSquare, badge: '35 Tasks' },
    {
      key: 'command-centre',
      label: 'Command Centre',
      icon: Radio,
      badge: activeLateCount > 0 ? `${activeLateCount} Alert` : undefined,
      badgeColor: 'crimson'
    },
    { key: 'finance', label: 'Finance', icon: Coins },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Sliders }
  ];

  // Role-Aware Navigation Mapping
  const roleAllowedTabs: Record<AppRole, NavItemKey[]> = {
    FOUNDER: ['overview', 'enquiries', 'clients', 'weddings', 'vendors', 'quotations', 'tasks', 'command-centre', 'finance', 'reports', 'settings'],
    PLANNER: ['overview', 'weddings', 'enquiries', 'clients', 'vendors', 'quotations', 'tasks', 'command-centre', 'reports'],
    COORDINATOR: ['weddings', 'command-centre', 'tasks'],
    FINANCE: ['overview', 'finance', 'reports'],
    VENDOR: [],
    CLIENT: [],
    FAMILY: []
  };

  const allowed = roleAllowedTabs[role] || roleAllowedTabs.FOUNDER;
  const filteredNavItems = allNavItems.filter(item => allowed.includes(item.key));

  const handleItemClick = (key: NavItemKey) => {
    onSelectTab(key);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#0D1B2A] text-slate-300 flex flex-col h-screen border-r border-[#1B3B6F]/40 shadow-xl select-none transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1B3B6F]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFCA9B] to-[#C5A059] flex items-center justify-center text-[#0D1B2A] shadow-md shadow-[#C5A059]/20">
              <Crown className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-white tracking-wide leading-none">
                The Royal Knot
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-[#C5A059] font-medium block mt-1">
                Luxury Operations
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Role Scope Banner */}
        <div className="px-5 py-2.5 bg-[#142334] border-b border-[#1B3B6F]/30 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Role:</span>
          </span>
          <span className="font-mono font-bold text-[#DFCA9B] bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#C5A059]/30">
            {role}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => handleItemClick(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#1B3B6F] to-[#254B8C] text-white shadow-md shadow-[#1B3B6F]/40 border-l-3 border-[#C5A059]'
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

                {/* Badge Pills */}
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor === 'crimson'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.badgeColor === 'gold'
                        ? 'bg-[#C5A059]/20 text-[#DFCA9B] border border-[#C5A059]/40'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-[#1B3B6F]/40 bg-[#09131D]/80">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate">{user?.displayName || 'Active Session'}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Jaipur & Udaipur Destination Hubs
          </p>
        </div>
      </aside>
    </>
  );
};
