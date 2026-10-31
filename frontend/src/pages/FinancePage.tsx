import React, { useState } from 'react';
import { ChangeOrder, VendorSettlement, Wedding } from '../types';
import { ChangeOrderManager } from '../components/domain/ChangeOrderManager';
import { ReconciliationShield } from '../components/domain/ReconciliationShield';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import { Coins, ShieldCheck, CheckCircle2, AlertOctagon, Banknote } from 'lucide-react';

interface FinancePageProps {
  currentWedding: Wedding;
  changeOrders: ChangeOrder[];
  settlements: VendorSettlement[];
  onDisbursePayment: (settlementId: string) => void;
  onApproveChangeOrder: (orderId: string) => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({
  currentWedding,
  changeOrders,
  settlements,
  onDisbursePayment,
  onApproveChangeOrder
}) => {
  const [activeTab, setActiveTab] = useState<'settlement' | 'changeOrders' | 'clientMilestones'>('settlement');

  const totalAgreed = settlements.reduce((acc, s) => acc + s.agreedContractAmount, 0);
  const totalApprovedExtras = changeOrders.filter(c => c.status === 'APPROVED').reduce((acc, c) => acc + c.totalAmount, 0);
  const totalAdvances = settlements.reduce((acc, s) => acc + s.advancesPaid, 0);
  const totalBalanceDue = settlements.reduce((acc, s) => acc + s.balanceDue, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Financial Control, Extras & Vendor Reconciliation
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scenario 5: 15 vendor advances, 60 unexpected banquet guests, and extended DJ hours. Reconcile final bills net of advances with strict anti-duplicate payout safeguards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge label="Anti-Duplicate Shield Active" variant="success" size="sm" />
        </div>
      </div>

      {/* Financial Health KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <span className="text-xs font-semibold uppercase text-slate-400 block">1. Baseline Contracts</span>
          <CurrencyDisplay amount={totalAgreed} className="text-xl text-slate-800" />
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <span className="text-xs font-semibold uppercase text-slate-400 block">2. Approved Extras</span>
          <CurrencyDisplay amount={totalApprovedExtras} className="text-xl text-emerald-700" />
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <span className="text-xs font-semibold uppercase text-slate-400 block">3. Advances Disbursed</span>
          <CurrencyDisplay amount={totalAdvances} className="text-xl text-rose-700" />
        </div>

        <div className="bg-[#0D1B2A] text-white rounded-xl p-4 border border-[#C5A059]/40 shadow-xs">
          <span className="text-xs font-semibold uppercase text-[#C5A059] block">4. Net Payable Balance</span>
          <CurrencyDisplay amount={totalBalanceDue} className="text-xl text-white" />
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('settlement')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
            activeTab === 'settlement'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Vendor Final Reconciliation & Anti-Duplicate Shield
        </button>

        <button
          onClick={() => setActiveTab('changeOrders')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
            activeTab === 'changeOrders'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Change Orders (+60 Guests, +1 DJ Hr)
        </button>

        <button
          onClick={() => setActiveTab('clientMilestones')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
            activeTab === 'clientMilestones'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Client Payment Milestones (3 Stages)
        </button>
      </div>

      {/* Panels */}
      {activeTab === 'settlement' && (
        <ReconciliationShield
          settlements={settlements}
          onDisbursePayment={onDisbursePayment}
        />
      )}

      {activeTab === 'changeOrders' && (
        <ChangeOrderManager
          changeOrders={changeOrders}
          onApproveOrder={onApproveChangeOrder}
        />
      )}

      {activeTab === 'clientMilestones' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
              Three-Stage Client Payment Plan
            </h3>
            <p className="text-xs text-slate-500">
              Payments are collected in agreed stages: 1. Booking deposit, 2. Advance (1 month prior), 3. Final settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Stage 1: Booking Deposit</span>
                <StatusBadge label="PAID" variant="success" size="sm" />
              </div>
              <CurrencyDisplay amount={5000000} className="text-lg text-[#0D1B2A]" />
              <p className="text-[11px] text-slate-500">Paid at proposal confirmation. Triggered 25+ tasks.</p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Stage 2: Advance Payment</span>
                <StatusBadge label="PAID" variant="success" size="sm" />
              </div>
              <CurrencyDisplay amount={15000000} className="text-lg text-[#0D1B2A]" />
              <p className="text-[11px] text-slate-500">Received 30 days prior to event (2026-11-22).</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Stage 3: Final Settlement</span>
                <StatusBadge label="PENDING (POST EVENT)" variant="warning" size="sm" />
              </div>
              <CurrencyDisplay amount={15165000} className="text-lg text-[#1B3B6F]" />
              <p className="text-[11px] text-slate-500">Includes original ₹1.5 Cr + ₹1.65L approved extras.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
