import React from 'react';
import { Wedding } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import { Users2, Phone, Mail, MapPin, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface ClientsPageProps {
  weddings: Wedding[];
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ weddings }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">Client Portfolio & Family Coordinators</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official client records, verified contact channels, digital service agreement status, and authorized family decision-makers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {weddings.map(w => (
          <div key={w.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">{w.code}</span>
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">{w.coupleNames}</h3>
              </div>
              <StatusBadge label={w.status} variant="info" size="sm" />
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{w.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{w.weddingDate} (3-Day Event)</span>
              </div>
              <div className="flex items-center justify-between pt-1 font-medium">
                <span>Guests: {w.guestCount}</span>
                <CurrencyDisplay amount={w.budgetMax} format="compact" className="text-[#1B3B6F]" />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Digital Agreement Attached
              </span>
              <span className="text-slate-400 font-mono text-[10px]">{w.assignedPlanner.split(' ')[0]} (Lead)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
