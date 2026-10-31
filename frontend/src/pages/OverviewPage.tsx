import React from 'react';
import { SeasonMetrics, Wedding } from '../types';
import { StatCard } from '../components/common/StatCard';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Crown,
  Coins,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  Users,
  UserPlus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

interface OverviewPageProps {
  metrics: SeasonMetrics;
  weddings: Wedding[];
  onSelectWedding: (wedding: Wedding) => void;
  onNavigateToTab: (tab: any) => void;
}

/**
 * OverviewPage component
 *
 * Executive season command dashboard showing margin tracking, vendor radar, and cashflow.
 */
export const OverviewPage: React.FC<OverviewPageProps> = ({
  metrics,
  weddings,
  onSelectWedding,
  onNavigateToTab
}) => {
  const chartData = metrics.weddingWiseProfits.map(w => ({
    name: w.name.split(' ')[0],
    Revenue: w.revenue / 100000,
    Cost: w.cost / 100000,
    Profit: w.profit / 100000,
    Margin: w.margin
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0D1B2A] to-[#1B3B6F] text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#C5A059]" />
              <span className="text-xs uppercase tracking-widest text-[#DFCA9B] font-semibold">
                The Royal Knot Season Intelligence
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              Jaipur & Udaipur Season Command Dashboard
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Consolidated operational and financial performance across all 25 destination weddings. Real-time margin tracking incorporating direct vendor bills, event-day extras, and internal planner timesheet labor.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('accounts')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFCA9B] to-[#C5A059] text-[#0D1B2A] font-bold text-xs uppercase tracking-wider hover:from-[#e8d7b3] hover:to-[#d4b069] transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite & Manage Accounts</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Season Portfolio"
          value={`${metrics.totalWeddingsPlanned} Weddings`}
          subtitle={`${metrics.completedWeddings} Completed • ${metrics.inProgressWeddings} Active`}
          icon={Crown}
          highlightColor="gold"
        />

        <StatCard
          title="Total Season Revenue"
          value={<CurrencyDisplay amount={metrics.totalSeasonRevenue} format="crores" showDecimals />}
          subtitle="Contracted & Confirmed Packages"
          icon={Coins}
          highlightColor="navy"
        />

        <StatCard
          title="True Season Net Profit"
          value={<CurrencyDisplay amount={metrics.totalNetProfit} format="crores" showDecimals />}
          subtitle={`Average Margin: ${metrics.averageMarginPercent}%`}
          icon={TrendingUp}
          highlightColor="emerald"
        />

        <StatCard
          title="Vendor Reliability"
          value={`${metrics.vendorReliabilityAverage} / 5.0`}
          subtitle="On-time delivery across 18 vendor categories"
          icon={CheckCircle2}
          highlightColor="gold"
        />
      </div>

      {/* Two Column Section: Profitability Bar Chart + Active Wedding Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Financial Profit Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                Wedding-wise Profit & Cost Breakdown (₹ Lakhs)
              </h3>
              <p className="text-xs text-slate-500">
                Formula: Profit = Revenue − Vendor Bills − Direct Extras − Planner Labor Hours
              </p>
            </div>
            <StatusBadge label="Analytic Accounting" variant="info" size="sm" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="L" />
                <Tooltip
                  formatter={(val: any) => [`₹${val} Lakhs`, '']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="Revenue" fill="#1B3B6F" name="Client Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cost" fill="#94a3b8" name="Vendor & Extras Cost" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#C5A059" name="True Net Profit" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Urgent Operational Action Radar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Day-of Operations Radar
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status for today's active wedding in Udaipur.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Late Vendor Alert
                </span>
                <StatusBadge label="45m Late" variant="danger" size="sm" />
              </div>
              <p className="text-xs font-semibold text-[#0D1B2A]">DJ Shadow & Sound Rig</p>
              <p className="text-[11px] text-slate-600">Expected: 16:00 • Held in Udaipur Sukhadia traffic</p>
              <button
                onClick={() => onNavigateToTab('command-centre')}
                className="mt-1 text-xs font-bold text-rose-700 hover:text-rose-900 underline block"
              >
                Open Command Centre Cockpit →
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Schedule Delay
                </span>
                <StatusBadge label="+25 mins" variant="warning" size="sm" />
              </div>
              <p className="text-xs font-semibold text-[#0D1B2A]">Varmala Ceremony Rescheduled</p>
              <p className="text-[11px] text-slate-600">Photographer, DJ, Caterer, and Family Coordinator notified.</p>
              <button
                onClick={() => onNavigateToTab('command-centre')}
                className="mt-1 text-xs font-bold text-amber-800 hover:text-amber-950 underline block"
              >
                Track Vendor Acknowledgements →
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Upcoming Cashflow (30d)
                </span>
                <span className="text-xs font-bold font-mono text-emerald-800">
                  <CurrencyDisplay amount={metrics.upcomingReceivables30Days} format="crores" />
                </span>
              </div>
              <p className="text-[11px] text-slate-600">Receivables due: ₹4.5 Cr | Vendor dues: ₹2.8 Cr</p>
            </div>
          </div>
        </div>

      </div>

      {/* Active Weddings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
            Current Season Destination Weddings
          </h3>
          <button
            onClick={() => onNavigateToTab('weddings')}
            className="text-xs font-semibold text-[#1B3B6F] hover:underline"
          >
            View All 25 Weddings →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Code / Couple</th>
                <th className="py-2.5 px-3">Location & Date</th>
                <th className="py-2.5 px-3">Guests</th>
                <th className="py-2.5 px-3">Budget</th>
                <th className="py-2.5 px-3">Package</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weddings.map(w => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono text-slate-400 text-[11px] block">{w.code}</span>
                    <span className="font-bold text-[#0D1B2A] text-sm">{w.coupleNames}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-700 block">{w.location.split(',')[0]}</span>
                    <span className="text-slate-400 text-[11px]">{w.weddingDate}</span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700">{w.guestCount} Guests</td>
                  <td className="py-3 px-3">
                    <CurrencyDisplay amount={w.budgetMax} format="compact" className="text-[#1B3B6F]" />
                  </td>
                  <td className="py-3 px-3">
                    <span className="capitalize font-medium text-slate-600">
                      {w.packageType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge label={w.status} variant={w.status === 'EXECUTION' ? 'warning' : 'info'} size="sm" />
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => onSelectWedding(w)}
                      className="bg-[#1B3B6F]/10 hover:bg-[#1B3B6F] text-[#1B3B6F] hover:text-white font-semibold px-2.5 py-1 rounded-md transition-colors"
                    >
                      Select Event
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
