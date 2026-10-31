import React from 'react';
import { SeasonMetrics } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import { BarChart3, TrendingUp, Download, Printer, Crown, CheckCircle2 } from 'lucide-react';

interface ReportsPageProps {
  metrics: SeasonMetrics;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Founder's Season Review & Profitability Reports
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scenario 6: Answers the founder's simple question: Which weddings made money, and which did not? Aggregates client payments, vendor bills, and planning-team hours across all 25 weddings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-2 px-3.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Season Report</span>
          </button>
        </div>
      </div>

      {/* Season P&L Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
            Official Season Profit & Loss Statement (FY 2026-27)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Consolidated 25 Weddings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 block uppercase font-semibold">1. Total Recognized Revenue</span>
            <CurrencyDisplay amount={metrics.totalSeasonRevenue} format="crores" showDecimals className="text-xl text-[#1B3B6F]" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 block uppercase font-semibold">2. Direct Vendor Bills</span>
            <CurrencyDisplay amount={metrics.totalVendorExpenditure} format="crores" showDecimals className="text-xl text-rose-700" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 block uppercase font-semibold">3. Team Labour Cost</span>
            <CurrencyDisplay amount={metrics.totalPlannerLaborCost} format="crores" showDecimals className="text-xl text-slate-700" />
          </div>

          <div className="p-4 rounded-xl bg-[#0D1B2A] text-white border border-[#C5A059]/40 shadow-xs">
            <span className="text-xs text-[#DFCA9B] block uppercase font-semibold">4. Net Season Profit</span>
            <CurrencyDisplay amount={metrics.totalNetProfit} format="crores" showDecimals className="text-xl text-[#DFCA9B]" />
            <span className="text-[10px] text-emerald-400 block mt-0.5 font-semibold">
              {metrics.averageMarginPercent}% Profit Margin
            </span>
          </div>
        </div>
      </div>

      {/* Wedding-Wise Margin Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
          Wedding-by-Wedding Profitability Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Wedding Name</th>
                <th className="py-2.5 px-3">Client Revenue</th>
                <th className="py-2.5 px-3">Vendor Costs</th>
                <th className="py-2.5 px-3">Team Labor</th>
                <th className="py-2.5 px-3">Net Profit</th>
                <th className="py-2.5 px-3">Margin %</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.weddingWiseProfits.map((w, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-[#0D1B2A] text-sm">{w.name}</td>
                  <td className="py-3 px-3">
                    <CurrencyDisplay amount={w.revenue} format="compact" className="text-slate-800" />
                  </td>
                  <td className="py-3 px-3">
                    <CurrencyDisplay amount={w.cost} format="compact" className="text-rose-700" />
                  </td>
                  <td className="py-3 px-3">
                    <CurrencyDisplay amount={w.labor} format="compact" className="text-slate-600" />
                  </td>
                  <td className="py-3 px-3 font-bold">
                    <CurrencyDisplay amount={w.profit} format="compact" className="text-emerald-700" />
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{w.margin}%</td>
                  <td className="py-3 px-3">
                    <StatusBadge label={w.status} variant="info" size="sm" />
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
