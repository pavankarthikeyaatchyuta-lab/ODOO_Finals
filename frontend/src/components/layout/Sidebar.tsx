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
  X
} from 'lucide-react';

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
  activeLateCount = 1,
  mobileOpen = false,
  onCloseMobile
}) => {
  const navItems: Array<{
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
    { key: 'tasks', label: 'Planning Tasks', icon: CheckSquare, badge: '26 Tasks' },
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
              <h1 className="font-serif font-bold text-lg tracking-wide text-white flex items-center gap-1.5">
                The Royal Knot
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              </h1>
              <p className="text-[10px] tracking-widest uppercase text-[#C5A059] font-semibold">
                Jaipur & Udaipur Luxury
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Operations & Finance
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleItemClick(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#1B3B6F] text-white shadow-sm shadow-[#1B3B6F]/40 border-l-3 border-[#C5A059]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#C5A059]' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="tracking-wide">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor === 'crimson'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : item.badgeColor === 'gold'
                        ? 'bg-[#C5A059]/20 text-[#DFCA9B] border border-[#C5A059]/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User & System Status */}
        <div className="p-4 border-t border-[#1B3B6F]/40 bg-[#09131D]/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              System Live
            </span>
            <span className="text-[11px] font-mono text-slate-400">v2.4 Final</span>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <div className="w-8 h-8 rounded-full bg-[#1B3B6F] border border-[#C5A059]/60 flex items-center justify-center text-xs font-bold text-white">
              PM
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">Priya Mehra</p>
              <p className="text-[10px] text-slate-400 truncate">Lead Luxury Planner</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
