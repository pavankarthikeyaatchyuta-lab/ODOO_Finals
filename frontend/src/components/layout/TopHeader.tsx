import React from 'react';
import {
  Bell,
  Search,
  RotateCcw,
  Calendar,
  MapPin,
  Users,
  ShieldCheck
} from 'lucide-react';
import { Wedding } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';

interface TopHeaderProps {
  currentWedding: Wedding;
  weddingsList: Wedding[];
  onSelectWedding: (wedding: Wedding) => void;
  onResetDemoData: () => void;
  activeLateCount?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentWedding,
  weddingsList,
  onSelectWedding,
  onResetDemoData,
  activeLateCount = 1
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Active Wedding Selector with Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Active Event:
          </span>
          <select
            value={currentWedding.id}
            onChange={e => {
              const selected = weddingsList.find(w => w.id === e.target.value);
              if (selected) onSelectWedding(selected);
            }}
            className="text-sm font-bold text-[#0D1B2A] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#C5A059]"
          >
            {weddingsList.map(w => (
              <option key={w.id} value={w.id}>
                {w.coupleNames} ({w.code})
              </option>
            ))}
          </select>
        </div>

        {/* Wedding Quick Metadata Badges */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 pl-3 border-l border-slate-200">
          <span className="flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
            {currentWedding.weddingDate}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
            {currentWedding.location.split(',')[0]}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Users className="w-3.5 h-3.5 text-[#C5A059]" />
            {currentWedding.guestCount} Guests
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="text-slate-600 font-semibold">Budget:</span>
            <CurrencyDisplay amount={currentWedding.budgetMax} format="compact" className="text-[#1B3B6F]" />
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Reset Demo State Button */}
        <button
          onClick={onResetDemoData}
          title="Reset to official demo scenario data"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#0D1B2A] px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Reset Demo State</span>
        </button>

        {/* Operational Alert Pill */}
        {activeLateCount > 0 && (
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            <span>{activeLateCount} Vendor Alert</span>
          </div>
        )}

        {/* Digital Agreement Shield Badge */}
        {currentWedding.agreementSigned ? (
          <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Agreement Gated: Signed</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
            <span>Agreement Pending</span>
          </div>
        )}
      </div>
    </header>
  );
};
