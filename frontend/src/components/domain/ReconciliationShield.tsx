import React from 'react';
import { VendorSettlement } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { StatusBadge } from '../common/StatusBadge';
import { ShieldCheck, AlertOctagon, CheckCircle2, History, Banknote } from 'lucide-react';

interface ReconciliationShieldProps {
  settlements: VendorSettlement[];
  onDisbursePayment: (settlementId: string) => void;
}

export const ReconciliationShield: React.FC<ReconciliationShieldProps> = ({
  settlements,
  onDisbursePayment
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
            Vendor Settlement & Anti-Duplicate Payment Shield
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Calculates: <span className="font-mono font-semibold">Net Balance = (Agreed Quote + Approved Extras) − Advances Disbursed</span>. Strictly enforces duplicate payment safeguards so no vendor is paid twice.
        </p>
      </div>

      {/* Settlements Table / Cards */}
      <div className="space-y-4">
        {settlements.map(settlement => {
          const isPaid = settlement.status === 'PAID';

          return (
            <div
              key={settlement.id}
              className={`p-4 rounded-xl border transition-all ${
                isPaid
                  ? 'bg-slate-50/60 border-slate-200'
                  : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">{settlement.vendorName}</h4>
                  <p className="text-xs text-slate-500">{settlement.category}</p>
                </div>
                <StatusBadge
                  label={settlement.status}
                  variant={isPaid ? 'success' : 'warning'}
                  size="sm"
                />
              </div>

              {/* Formula Columns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500 block">1. Agreed Quote:</span>
                  <CurrencyDisplay amount={settlement.agreedContractAmount} className="text-sm text-slate-800" />
                </div>
                <div>
                  <span className="text-slate-500 block">2. Approved Extras:</span>
                  <span className="text-emerald-700 font-semibold font-mono text-sm">
                    +₹{settlement.approvedExtras.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">3. Advance Paid:</span>
                  <span className="text-rose-700 font-semibold font-mono text-sm">
                    -₹{settlement.advancesPaid.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <span className="text-slate-500 block font-semibold">Net Balance Due:</span>
                  <CurrencyDisplay
                    amount={settlement.balanceDue}
                    className={`text-base font-bold ${isPaid ? 'text-slate-400' : 'text-[#1B3B6F]'}`}
                  />
                </div>
              </div>

              {/* Payment History & Anti-Duplicate Protection */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Payment Audit Trail:</span>
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
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Zero Balance (Fully Settled)</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onDisbursePayment(settlement.id)}
                      className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Banknote className="w-4 h-4 text-[#C5A059]" />
                      <span>Disburse Remaining ₹{settlement.balanceDue.toLocaleString('en-IN')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
