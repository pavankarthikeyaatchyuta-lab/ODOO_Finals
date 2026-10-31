import React from 'react';
import { Wedding } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import { Crown, Sparkles, Calendar, Users, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';

interface WeddingsPageProps {
  weddings: Wedding[];
  currentWedding: Wedding;
  onSelectWedding: (wedding: Wedding) => void;
  onNavigateToTab: (tab: any) => void;
}

export const WeddingsPage: React.FC<WeddingsPageProps> = ({
  weddings,
  currentWedding,
  onSelectWedding,
  onNavigateToTab
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Central Wedding Workspace
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 1.3: Differentiates Full-Service (complete theme, venue, vendor procurement, layout, rehearsal) vs Partial / Day-Of (run sheet, check-in, family movement, cleanup).
          </p>
        </div>
      </div>

      {/* Active Wedding Hero Card */}
      <div className="bg-gradient-to-br from-[#0D1B2A] to-[#1B3B6F] text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#DFCA9B]">{currentWedding.code}</span>
              <StatusBadge label={currentWedding.status} variant="warning" size="sm" />
              <StatusBadge
                label={currentWedding.packageType === 'full_service' ? 'Full-Service Package' : 'Partial / Day-Of Package'}
                variant="info"
                size="sm"
              />
            </div>
            <h3 className="font-serif font-bold text-2xl tracking-wide">{currentWedding.coupleNames}</h3>
            <p className="text-xs text-[#DFCA9B] font-medium">{currentWedding.theme}</p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-300 font-semibold uppercase block">Maximum Budget</span>
            <CurrencyDisplay amount={currentWedding.budgetMax} format="crores" showDecimals className="text-2xl text-[#DFCA9B]" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block">Dates:</span>
            <span className="font-semibold">{currentWedding.weddingDate} to {currentWedding.endDate}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Location:</span>
            <span className="font-semibold">{currentWedding.location.split(',')[0]}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Guest Count:</span>
            <span className="font-semibold">{currentWedding.guestCount} Guests</span>
          </div>
          <div>
            <span className="text-slate-400 block">Lead Planner:</span>
            <span className="font-semibold text-[#DFCA9B]">{currentWedding.assignedPlanner}</span>
          </div>
        </div>

        {/* Quick Action Links */}
        <div className="pt-2 flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateToTab('quotations')}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 transition-colors"
          >
            Vendor Quotes →
          </button>
          <button
            onClick={() => onNavigateToTab('tasks')}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 transition-colors"
          >
            25+ Tasks Board →
          </button>
          <button
            onClick={() => onNavigateToTab('command-centre')}
            className="bg-[#C5A059] hover:bg-[#9D7C36] text-[#0D1B2A] text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            Live Command Centre →
          </button>
          <button
            onClick={() => onNavigateToTab('finance')}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 transition-colors"
          >
            Reconciliation & Extras →
          </button>
        </div>
      </div>

      {/* Multi-Function Breakdown (Mehendi, Sangeet, Pheras, Reception) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
          Sub-Functions & Event Execution Stages
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <span className="text-[10px] font-bold text-[#C5A059] uppercase">Day 1 • Afternoon</span>
            <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">Mehendi & High Tea</h4>
            <p className="text-xs text-slate-500">Lakeside lawns, organic henna stations, Rajasthani folk vocalists.</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <span className="text-[10px] font-bold text-[#C5A059] uppercase">Day 1 • Evening</span>
            <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">Sangeet & Sufi Night</h4>
            <p className="text-xs text-slate-500">Zenana Mahal courtyard, acoustic lighting, family choreography.</p>
          </div>

          <div className="p-4 rounded-xl border border-[#C5A059]/50 bg-amber-50/30 space-y-1.5 ring-1 ring-[#C5A059]/20">
            <span className="text-[10px] font-bold text-amber-800 uppercase">Day 2 • Active Today</span>
            <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">Varmala & Vedic Pheras</h4>
            <p className="text-xs text-slate-500">Floating lotus stage, 400 guests, Baraat boat procession.</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <span className="text-[10px] font-bold text-[#C5A059] uppercase">Day 3 • Gala Night</span>
            <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">Royal Banquet Reception</h4>
            <p className="text-xs text-slate-500">8 live royal buffet stations, jazz ensemble, champagne toast.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
