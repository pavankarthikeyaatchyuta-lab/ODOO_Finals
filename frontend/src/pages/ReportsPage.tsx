/**
 * =============================================================================
 * File: ReportsPage.tsx
 * Module: Agency Operations Page
 * =============================================================================
 * Delivers full-scale wedding planning and coordination workspace for ReportsPage, supporting real-time data inspection, filtering, and reporting.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  SeasonMetrics,
  Wedding
} from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Crown,
  CheckCircle2,
  Calendar,
  Building,
  Filter,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Award,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ReportsPageProps {
  metrics: SeasonMetrics;
  weddingsList?: Wedding[];
}

const PIE_COLORS = ['#C5A059', '#1B3B6F', '#0D1B2A', '#8E7341', '#4A6B94'];

/**
 * ReportsPage component
 *
 * Season analytics, profit variance reports, and historical wedding metrics.
 */
export const ReportsPage: React.FC<ReportsPageProps> = ({
  metrics,
  weddingsList = []
}) => {
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>('ALL');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [activeViewTab, setActiveViewTab] = useState<'overview' | 'budgetVsActual' | 'teamHours' | 'vendors'>('overview');

  // Filtered data based on wedding selector
  const filteredWeddings = useMemo(() => {
    if (selectedWeddingId === 'ALL') {
      return metrics.weddingWiseProfits;
    }
    return metrics.weddingWiseProfits.filter(w => w.weddingId === selectedWeddingId);
  }, [metrics.weddingWiseProfits, selectedWeddingId]);

  // Aggregate KPI figures based on selection
  const kpis = useMemo(() => {
    if (selectedWeddingId === 'ALL') {
      return {
        revenue: metrics.totalSeasonRevenue,
        vendorCost: metrics.totalVendorExpenditure,
        laborCost: metrics.totalPlannerLaborCost,
        netProfit: metrics.totalNetProfit,
        margin: metrics.averageMarginPercent,
        hours: metrics.totalPlanningHours,
        weddingsCount: metrics.totalWeddingsPlanned
      };
    }
    const single = filteredWeddings[0];
    if (!single) return { revenue: 0, vendorCost: 0, laborCost: 0, netProfit: 0, margin: 0, hours: 0, weddingsCount: 0 };
    return {
      revenue: single.revenue,
      vendorCost: single.cost,
      laborCost: single.labor,
      netProfit: single.profit,
      margin: single.margin,
      hours: single.planningHours,
      weddingsCount: 1
    };
  }, [metrics, selectedWeddingId, filteredWeddings]);

  // Format Lakhs / Crores for Chart Axis
  const formatAxisCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    return `₹${val}`;
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0D1B2A] text-white p-3 rounded-xl border border-[#C5A059]/40 shadow-xl text-xs space-y-1">
          <p className="font-bold font-serif text-[#DFCA9B]">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex justify-between gap-4 text-[11px]">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-mono font-bold">
                ₹{Number(entry.value).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Founder Season Profitability & Executive Dashboard
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Answers the founder's core question: <em>Which weddings made money, and which did not?</em> Aggregates client revenue, vendor bills, and planning team labor across the season.
          </p>
        </div>

        {/* Global Controls & Print */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Wedding Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedWeddingId}
              onChange={e => setSelectedWeddingId(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Weddings (Consolidated 25)</option>
              {metrics.weddingWiseProfits.map(w => (
                <option key={w.weddingId} value={w.weddingId}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quarter Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedQuarter}
              onChange={e => setSelectedQuarter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Full FY 2026-27</option>
              <option value="Q2">Q2 (Aug - Oct 2026)</option>
              <option value="Q3">Q3 (Nov - Jan 2027)</option>
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-2 px-3.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Executive P&L</span>
          </button>
        </div>
      </div>

      {/* Season P&L Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
              Official Season Profit & Loss Statement (FY 2026-27)
            </h3>
            <span className="text-xs text-slate-400">
              {selectedWeddingId === 'ALL'
                ? `Consolidated P&L for 25 Weddings (${metrics.completedWeddings} Executed, ${metrics.inProgressWeddings} In Planning)`
                : `Dedicated P&L for ${filteredWeddings[0]?.name}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Upcoming Receivables (30D)</span>
              <CurrencyDisplay amount={metrics.upcomingReceivables30Days} format="compact" className="text-xs font-bold text-emerald-700" />
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Upcoming Vendor Dues (30D)</span>
              <CurrencyDisplay amount={metrics.upcomingVendorDues30Days} format="compact" className="text-xs font-bold text-rose-700" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
            <span className="text-xs text-slate-500 block uppercase font-semibold">1. Client Recognized Revenue</span>
            <CurrencyDisplay amount={kpis.revenue} format="crores" showDecimals className="text-xl text-[#1B3B6F]" />
            <span className="text-[10px] text-slate-400 block mt-1">Total contract billings</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
            <span className="text-xs text-slate-500 block uppercase font-semibold">2. Direct Vendor Bills</span>
            <CurrencyDisplay amount={kpis.vendorCost} format="crores" showDecimals className="text-xl text-rose-700" />
            <span className="text-[10px] text-slate-400 block mt-1">Reconciled vendor disbursements</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
            <span className="text-xs text-slate-500 block uppercase font-semibold">3. Planning Team Labor</span>
            <CurrencyDisplay amount={kpis.laborCost} format="crores" showDecimals className="text-xl text-slate-700" />
            <span className="text-[10px] text-slate-400 block mt-1">
              {kpis.hours.toLocaleString('en-IN')} Staff hours tracked
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0D1B2A] text-white border border-[#C5A059]/40 shadow-xs text-left">
            <span className="text-xs text-[#DFCA9B] block uppercase font-semibold">4. Net Profit</span>
            <CurrencyDisplay amount={kpis.netProfit} format="crores" showDecimals className="text-xl text-[#DFCA9B]" />
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-emerald-400 font-bold font-mono">
                {kpis.margin}% Margin
              </span>
              <span className="text-[10px] text-slate-400">Net after labor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveViewTab('overview')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeViewTab === 'overview'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Wedding Profitability & Monthly Trends
        </button>

        <button
          onClick={() => setActiveViewTab('budgetVsActual')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeViewTab === 'budgetVsActual'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Estimated vs. Actual Operational Costs
        </button>

        <button
          onClick={() => setActiveViewTab('teamHours')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeViewTab === 'teamHours'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Planning Team Hours & Labor Allocation
        </button>

        <button
          onClick={() => setActiveViewTab('vendors')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeViewTab === 'vendors'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Vendor Performance & Spend Index
        </button>
      </div>

      {/* PANEL 1: WEDDING PROFITABILITY & MONTHLY FLOW */}
      {activeViewTab === 'overview' && (
        <div className="space-y-6">
          {/* Chart 1: Grouped BarChart for Wedding Profitability */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-serif font-bold text-base text-[#0D1B2A]">
                  Profitability per Wedding: Revenue vs. Vendor Costs vs. Net Margin
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualizes profitability margins across each luxury wedding destination.
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredWeddings} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    angle={-15}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={formatAxisCurrency}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  />
                  <Bar dataKey="revenue" name="Client Revenue" fill="#1B3B6F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="Vendor Cost" fill="#E11D48" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Net Profit" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Season Monthly Flow */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-serif font-bold text-base text-[#0D1B2A]">
                  Monthly Financial Velocity: Revenue Inflow vs. Vendor Outflow
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tracks cashflow progression through peak wedding season months (August 2026 to January 2027).
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.monthlyRevenueTrends} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B3B6F" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1B3B6F" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tickFormatter={formatAxisCurrency} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="clientRevenue" name="Revenue Collected" stroke="#1B3B6F" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="vendorExpense" name="Vendor Bills Paid" stroke="#E11D48" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                  <Area type="monotone" dataKey="netProfit" name="Net Season Profit" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 2: ESTIMATED VS ACTUAL OPERATIONAL COSTS */}
      {activeViewTab === 'budgetVsActual' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-serif font-bold text-base text-[#0D1B2A]">
                Estimated versus Actual Costs by Operational Category
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Compares initial RFQ budgets against final reconciled payouts across all service lines.
              </p>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.budgetVsActualVariances} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickFormatter={formatAxisCurrency} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />
                <Bar dataKey="estimatedCost" name="Estimated Budget" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actualCost" name="Actual Audited Cost" fill="#1B3B6F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Variance Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {metrics.budgetVsActualVariances.map((item, idx) => {
              const isOver = item.variance > 0;
              return (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block truncate">{item.category}</span>
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[10px]">Actual vs Budget</span>
                    <CurrencyDisplay amount={item.actualCost} className="font-bold text-slate-800" />
                  </div>
                  <div className={`text-[11px] font-mono font-bold flex items-center gap-1 ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isOver ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{isOver ? `+${item.variancePct}%` : `${item.variancePct}%`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PANEL 3: PLANNING TEAM HOURS & LABOR COST */}
      {activeViewTab === 'teamHours' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart: Hours Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C5A059]" />
                <span>Planning Team Hours by Role (1,840 Total Hours)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff time invested per luxury specialization.
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.planningLaborAllocations}
                    dataKey="hours"
                    nameKey="role"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: any) => `${(name || '').split(' ')[0]}: ${(Number(percent || 0) * 100).toFixed(0)}%`}
                  >
                    {metrics.planningLaborAllocations.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Role Labor Billing Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C5A059]" />
                <span>Team Labor Cost Realization</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Internal labor cost capitalized into seasonal profitability statements.
              </p>
            </div>

            <div className="space-y-3">
              {metrics.planningLaborAllocations.map((role, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800">{role.role}</h5>
                    <span className="text-[11px] text-slate-500">
                      {role.headcount} team members • {role.hours} hours logged @ ₹{role.hourlyRate.toLocaleString('en-IN')}/hr
                    </span>
                  </div>
                  <div className="text-right">
                    <CurrencyDisplay amount={role.totalCost} className="font-bold text-[#1B3B6F] text-sm" />
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {Math.round((role.hours / metrics.totalPlanningHours) * 100)}% of total effort
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PANEL 4: VENDOR PERFORMANCE & SPEND INDEX */}
      {activeViewTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C5A059]" />
                <span>Vendor Partner Performance & Expenditure Index</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Cross-references total seasonal spend against arrival punctuality and operational rating.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Average Fleet Punctuality:</span>
              <strong className="text-emerald-700 font-mono text-sm">96.4%</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Vendor Partner</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Punctuality Score</th>
                  <th className="py-2.5 px-3">Weddings Served</th>
                  <th className="py-2.5 px-3 text-right">Total Seasonal Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.vendorPerformanceIndex.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-[#0D1B2A]">{v.vendorName}</td>
                    <td className="py-3 px-3 text-slate-600">{v.category}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-[#C5A059] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ★ {v.rating.toFixed(1)} / 5.0
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${v.punctualityPct >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${v.punctualityPct}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-700">{v.punctualityPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{v.weddingsServed} Events</td>
                    <td className="py-3 px-3 text-right">
                      <CurrencyDisplay amount={v.totalSpend} format="compact" className="font-bold text-[#1B3B6F]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wedding-Wise Margin Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
              Comprehensive Wedding-by-Wedding Profitability Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Net profit realized after deducting direct vendor settlements and planning team hours.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing {filteredWeddings.length} of {metrics.totalWeddingsPlanned} Weddings
          </span>
        </div>

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
                <th className="py-2.5 px-3">Hours Logged</th>
                <th className="py-2.5 px-3">Lifecycle Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWeddings.map((w, idx) => (
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
                  <td className="py-3 px-3 font-mono text-slate-600">{w.planningHours} hrs</td>
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
