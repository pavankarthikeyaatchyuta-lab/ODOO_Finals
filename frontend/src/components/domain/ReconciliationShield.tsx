/**
 * =============================================================================
 * File: ReconciliationShield.tsx
 * Module: Domain-Specific Workflow Component
 * =============================================================================
 * Specialized operational module (ReconciliationShield) supporting interactive wedding workflows like RFQ comparison, change orders, run-sheet, or settlements.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState } from 'react';
import { VendorSettlement } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { StatusBadge } from '../common/StatusBadge';
import {
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  History,
  Banknote,
  AlertTriangle,
  Scale,
  FileCheck2,
  X,
  Lock,
  ArrowRight
} from 'lucide-react';

interface ReconciliationShieldProps {
  settlements: VendorSettlement[];
  onDisbursePayment: (settlementId: string) => Promise<void> | void;
}

/**
 * ReconciliationShield component
 *
 * Post-event 3-way matching settlement shield with anti-duplicate payout protection.
 */
export const ReconciliationShield: React.FC<ReconciliationShieldProps> = ({
  settlements,
  onDisbursePayment
}) => {
  const [confirmModalSettlement, setConfirmModalSettlement] = useState<VendorSettlement | null>(null);
  const [disbursing, setDisbursing] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);

  const totalAgreed = settlements.reduce((sum, s) => sum + s.agreedContractAmount, 0);
  const totalApprovedExtras = settlements.reduce((sum, s) => sum + s.approvedExtras, 0);
  const totalAdvances = settlements.reduce((sum, s) => sum + s.advancesPaid, 0);
  const totalFinalBills = settlements.reduce((sum, s) => sum + s.finalBillAmountSubmitted, 0);
  const totalNetDue = settlements.reduce((sum, s) => sum + s.balanceDue, 0);

  const handleOpenDisburse = (s: VendorSettlement) => {
    if (s.status === 'PAID' || s.balanceDue <= 0) {
      setDuplicateAlert(`ANTI-DUPLICATE GUARD TRIGGERED: ${s.vendorName} invoice is already settled in full. Secondary payout blocked.`);
      return;
    }
    setDuplicateAlert(null);
    setConfirmModalSettlement(s);
  };

  const handleConfirmDisbursement = async () => {
    if (!confirmModalSettlement) return;
    setDisbursing(true);
    try {
      await onDisbursePayment(confirmModalSettlement.id);
      setConfirmModalSettlement(null);
    } catch (err: any) {
      setDuplicateAlert(err.message || 'Payment blocked by anti-duplicate safeguard.');
    } finally {
      setDisbursing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#C5A059]" />
            <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
              5-Way Vendor Bill Reconciliation & Anti-Duplicate Payment Shield
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconciles: <span className="font-mono font-semibold text-slate-700">Net Balance = (Original Quotation + Approved Extras) − Payments Already Made</span> against the vendor's submitted final bill.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Anti-Duplicate Payment Guard Active</span>
        </div>
      </div>

      {/* Duplicate Alert Banner if triggered */}
      {duplicateAlert && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{duplicateAlert}</span>
          </div>
          <button
            onClick={() => setDuplicateAlert(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 5-Way KPI Pillars */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            1. Original Quotes
          </span>
          <CurrencyDisplay amount={totalAgreed} className="text-base text-slate-800" />
          <span className="text-[10px] text-slate-400 block">Baseline RFQs</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            2. Submitted Final Bills
          </span>
          <CurrencyDisplay amount={totalFinalBills} className="text-base text-slate-800" />
          <span className="text-[10px] text-slate-400 block">Invoices presented</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
            3. Approved Extras
          </span>
          <CurrencyDisplay amount={totalApprovedExtras} className="text-base text-emerald-700" />
          <span className="text-[10px] text-emerald-600 block">Change orders (+60 guests, DJ)</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-rose-700 block tracking-wider">
            4. Advances Disbursed
          </span>
          <CurrencyDisplay amount={totalAdvances} className="text-base text-rose-700" />
          <span className="text-[10px] text-rose-600 block">Historical disbursements</span>
        </div>

        <div className="bg-[#0D1B2A] text-white p-2.5 rounded-lg border border-[#C5A059]/40 col-span-2 lg:col-span-1 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#DFCA9B] block tracking-wider">
            5. Net Balance Due
          </span>
          <CurrencyDisplay amount={totalNetDue} className="text-base text-white font-bold" />
          <span className="text-[10px] text-slate-300 block">Awaiting bank payout</span>
        </div>
      </div>

      {/* Settlements Table / Cards */}
      <div className="space-y-4">
        {settlements.map(settlement => {
          const isPaid = settlement.status === 'PAID';
          const calculatedPayable = settlement.agreedContractAmount + settlement.approvedExtras;
          const hasDiscrepancy = settlement.finalBillAmountSubmitted !== calculatedPayable;

          return (
            <div
              key={settlement.id}
              className={`p-4 rounded-xl border transition-all ${
                isPaid
                  ? 'bg-slate-50/60 border-slate-200'
                  : 'bg-white border-slate-200 shadow-xs hover:border-[#C5A059]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">{settlement.vendorName}</h4>
                    <StatusBadge
                      label={settlement.status}
                      variant={isPaid ? 'success' : hasDiscrepancy ? 'danger' : 'warning'}
                      size="sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500">{settlement.category}</p>
                </div>

                {hasDiscrepancy && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Discrepancy: Submitted bill ₹{settlement.finalBillAmountSubmitted.toLocaleString('en-IN')} exceeds authorized ₹{calculatedPayable.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* 5-Column Side-by-Side Comparison Formula */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">1. Agreed Quotation</span>
                  <CurrencyDisplay amount={settlement.agreedContractAmount} className="text-sm text-slate-800" />
                  <span className="text-[10px] text-slate-400">Baseline contract</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">2. Final Submitted Bill</span>
                  <CurrencyDisplay amount={settlement.finalBillAmountSubmitted} className="text-sm text-slate-800" />
                  <span className="text-[10px] text-slate-400">Vendor invoice</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">3. Approved Extras</span>
                  <span className="text-emerald-700 font-semibold font-mono text-sm block">
                    +₹{settlement.approvedExtras.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-600">Change orders</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">4. Advances Paid</span>
                  <span className="text-rose-700 font-semibold font-mono text-sm block">
                    -₹{settlement.advancesPaid.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-rose-600">Pre-disbursed</span>
                </div>

                <div className="border-l border-slate-200 pl-3">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">5. Net Balance Due</span>
                  <CurrencyDisplay
                    amount={settlement.balanceDue}
                    className={`text-base font-bold ${isPaid ? 'text-slate-400' : 'text-[#1B3B6F]'}`}
                  />
                  <span className="text-[10px] font-mono text-slate-400">
                    {isPaid ? 'Balance cleared' : 'Authoritative due'}
                  </span>
                </div>
              </div>

              {/* Payment History & Anti-Duplicate Protection */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Transaction Audit Trail:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settlement.paymentHistory.map((txn, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200/80 font-mono"
                      >
                        {txn.type}: ₹{txn.amount.toLocaleString('en-IN')} on {txn.date} ({txn.reference})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Settlement Action Button */}
                <div>
                  {isPaid ? (
                    <button
                      onClick={() => handleOpenDisburse(settlement)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                      title="Invoice is already fully settled. Protected by Anti-Duplicate Shield."
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Settled (Anti-Duplicate Shield Locked)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenDisburse(settlement)}
                      className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Banknote className="w-4 h-4 text-[#DFCA9B]" />
                      <span>Disburse Net ₹{settlement.balanceDue.toLocaleString('en-IN')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Confirm Final Payout Disbursement */}
      {confirmModalSettlement && (
        <div className="fixed inset-0 z-50 bg-[#0D1B2A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                  Authorize Final Bank Disbursement
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {confirmModalSettlement.vendorName} ({confirmModalSettlement.category})
                </p>
              </div>
              <button
                onClick={() => setConfirmModalSettlement(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Original Quotation:</span>
                <CurrencyDisplay amount={confirmModalSettlement.agreedContractAmount} className="font-semibold text-slate-800" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Approved Extras:</span>
                <span className="text-emerald-700 font-semibold font-mono">
                  +₹{confirmModalSettlement.approvedExtras.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Advances Already Disbursed:</span>
                <span className="text-rose-700 font-semibold font-mono">
                  -₹{confirmModalSettlement.advancesPaid.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm">
                <span className="text-[#0D1B2A]">Net Remittance Payable:</span>
                <CurrencyDisplay amount={confirmModalSettlement.balanceDue} className="text-[#1B3B6F]" />
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                Once processed, this invoice status switches permanently to <strong>PAID</strong>. The Anti-Duplicate Shield will lock this record against any re-disbursement.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModalSettlement(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={disbursing}
                onClick={handleConfirmDisbursement}
                className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>{disbursing ? 'Disbursing...' : 'Confirm & Disburse Bank Payout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
