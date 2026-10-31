import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { VendorTabKey } from '../../components/vendor/VendorPortalLayout';

interface VendorOverviewPageProps {
  onNavigateTab: (tab: VendorTabKey) => void;
  pendingAckCount?: number;
}

/**
 * VendorOverviewPage component
 *
 * Vendor dashboard overview of assigned wedding and arrival schedule.
 */
export const VendorOverviewPage: React.FC<VendorOverviewPageProps> = ({
  onNavigateTab,
  pendingAckCount = 1
}) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome & Live Wedding Hero */}
      <div className="bg-[#0D1B2A] text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-[#C5A059]/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping"></span>
              Live Assigned Wedding
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Partner Contract Executed</span>
            </div>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F1E8]">
            Welcome, {user?.name || 'SpiceHeaven Royal Caterers'}
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            You are contracted for the royal wedding of{' '}
            <strong className="text-white">Rahul Sharma & Ananya Singh</strong> at Taj Lake Palace, Udaipur.
          </p>

          {/* Quick Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <div className="text-xs text-slate-400 font-medium">Next Call-Time</div>
              <div className="text-lg font-bold text-[#C5A059] mt-0.5 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Today · 14:00 IST</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Grand Banquet Kitchen Staging</div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium">Assigned Coordinator</div>
              <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#C5A059]" />
                <span>Priya Mehra (Lead Planner)</span>
              </div>
              <div className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>+91 98290 11223</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium">Arrival Status</div>
              <div className="mt-1">
                <StatusBadge label="CHECKED IN · ON SITE" variant="success" size="sm" />
              </div>
              <div className="text-xs text-slate-400 mt-1">Taj Lake Palace Service Dock B</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Required Banner if Pending Acknowledgement */}
      {pendingAckCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-950">
                Action Required: Timeline Directive Pending Acknowledgment
              </h3>
              <p className="text-xs text-amber-800 mt-0.5 max-w-xl">
                The planning team has issued a +30 min schedule adjustment for the Grand Reception dinner service (revised to 20:30 IST). Closed-loop protocol requires your immediate confirmation.
              </p>
            </div>
          </div>
          <Button
            variant="gold"
            size="sm"
            onClick={() => onNavigateTab('schedule')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Review & Acknowledge
          </Button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Contracted Amount</div>
          <div className="text-xl font-bold font-serif text-[#0D1B2A] mt-1">
            <CurrencyDisplay amount={1200000} />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Base RFQ Contract (400 Guests)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Advance Paid</div>
          <div className="text-xl font-bold font-serif text-emerald-600 mt-1">
            <CurrencyDisplay amount={400000} />
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Disbursed via RTGS</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Approved Extras (Change Order)</div>
          <div className="text-xl font-bold font-serif text-blue-600 mt-1">
            <CurrencyDisplay amount={150000} />
          </div>
          <div className="text-[11px] text-blue-600 mt-1">+60 Additional Guests Added</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Net Settlement Due</div>
          <div className="text-xl font-bold font-serif text-[#C5A059] mt-1">
            <CurrencyDisplay amount={950000} />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Payable upon final bill verification</div>
        </div>
      </div>

      {/* Event Schedule Preview & Contact Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Day-of Run Sheet for this Vendor */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-serif font-bold text-base text-[#0D1B2A]">
                Your Service Timings & Milestones
              </h2>
              <p className="text-xs text-slate-500">Live operational timetable for this evening</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab('schedule')}
            >
              Full Schedule
            </Button>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  14:00
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Banquet Prep & Live Counters Staging</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Service Dock B unloading, prep of 6 live tandoori and chaat stations.
                  </p>
                </div>
              </div>
              <StatusBadge label="COMPLETED" variant="success" size="sm" />
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                  19:00
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Welcome Canapés & High-Tea Service</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Mewar Terrace. Service team 24 stewards deployed for cocktail hour.
                  </p>
                </div>
              </div>
              <StatusBadge label="IN PROGRESS" variant="warning" size="sm" />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                  20:30
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Grand Royal Buffet Opening (Revised from 20:00)
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Jagmandir Island Courtyard. 460 guests catered across 4 buffet aisles.
                  </p>
                </div>
              </div>
              <StatusBadge label="DIRECTIVE ISSUED" variant="info" size="sm" />
            </div>
          </div>
        </div>

        {/* Right: Security & Confidentiality Box */}
        <div className="bg-[#F5F1E8]/60 rounded-2xl border border-[#C5A059]/30 p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#C5A059]">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-serif font-bold text-sm text-[#0D1B2A]">Partner Safeguards</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All details within this portal are strictly confidential under Schedule 4 of your Vendor Agreement.
          </p>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
            <li>Direct closed-loop schedule confirmation with lead coordinator.</li>
            <li>Guaranteed 48-hour post-event settlement upon verified supervisor sign-off.</li>
            <li>Zero unauthorized guests or media personnel allowed in back-of-house.</li>
          </ul>

          <div className="pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => onNavigateTab('issue')}
            >
              Report Incident / Equipment Need
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
