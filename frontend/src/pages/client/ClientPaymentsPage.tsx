import React from 'react';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  Building2,
  AlertCircle
} from 'lucide-react';

interface PaymentMilestone {
  id: string;
  name: string;
  percentage: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'SCHEDULED' | 'PENDING';
  paidAt?: string;
  utrNumber?: string;
  receiptNumber?: string;
}

export const ClientPaymentsPage: React.FC = () => {
  const milestones: PaymentMilestone[] = [
    {
      id: 'm-1',
      name: 'Initial Retainer & Destination Date Lock',
      percentage: '20%',
      amount: 7000000,
      dueDate: '2026-08-15',
      status: 'PAID',
      paidAt: '2026-08-14 · RTGS',
      utrNumber: 'HDFCR52026081498127391',
      receiptNumber: 'TRK-RCP-2026-001'
    },
    {
      id: 'm-2',
      name: '30-Day Pre-Production & Vendor Procurement',
      percentage: '50%',
      amount: 17500000,
      dueDate: '2026-09-30',
      status: 'PAID',
      paidAt: '2026-09-29 · NEFT',
      utrNumber: 'ICICIR52026092918239014',
      receiptNumber: 'TRK-RCP-2026-042'
    },
    {
      id: 'm-3',
      name: 'Final Reconciled Settlement & Additions (+60 Guests)',
      percentage: '30% + Extras',
      amount: 11350000,
      dueDate: '2026-11-05 (48h Post-Reception)',
      status: 'SCHEDULED'
    }
  ];

  const totalContract = 35000000;
  const approvedExtras = 850000;
  const totalPayable = totalContract + approvedExtras;
  const totalPaid = 24500000;
  const balanceRemaining = totalPayable - totalPaid;

  const handleDownloadReceipt = (receiptNo?: string) => {
    alert(`Downloading verified receipt ${receiptNo || 'TRK-RECEIPT.pdf'}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Payment Milestones & Verified Receipts
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 3.4: Milestone breakdown, escrow receipts, and transparent post-reception reconciliation for Rahul & Ananya.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>70% Milestone Secured</span>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Agreed Package Budget</div>
          <div className="text-xl font-bold font-serif text-[#0D1B2A] mt-1">
            <CurrencyDisplay amount={totalContract} />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Full-Service Heritage Scope</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Approved Additions</div>
          <div className="text-xl font-bold font-serif text-blue-600 mt-1">
            <CurrencyDisplay amount={approvedExtras} />
          </div>
          <div className="text-[11px] text-blue-600 mt-1">+60 Guests & Floral Extensions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Paid to Date</div>
          <div className="text-xl font-bold font-serif text-emerald-600 mt-1">
            <CurrencyDisplay amount={totalPaid} />
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">Receipts verified via Bank UTR</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Post-Event Balance Due</div>
          <div className="text-xl font-bold font-serif text-[#C5A059] mt-1">
            <CurrencyDisplay amount={balanceRemaining} />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Due after reception sign-off</div>
        </div>
      </div>

      {/* Milestones Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
            Contracted Milestone Breakdown
          </h3>
          <span className="text-xs text-slate-400">Strict Anti-Duplicate Escrow Shield</span>
        </div>

        <div className="space-y-3">
          {milestones.map(m => {
            const isPaid = m.status === 'PAID';
            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                  isPaid ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F1E8] text-[#C5A059] border border-[#C5A059]/30">
                      {m.percentage}
                    </span>
                    <h4 className="font-bold text-xs text-[#0D1B2A]">{m.name}</h4>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isPaid ? (
                      <span className="text-emerald-700 font-medium">
                        Paid on {m.paidAt} (UTR: {m.utrNumber})
                      </span>
                    ) : (
                      <span>Due Date: {m.dueDate}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#0D1B2A]">
                      <CurrencyDisplay amount={m.amount} />
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isPaid ? 'Receipt Issued' : 'Due upon completion'}
                    </div>
                  </div>

                  <StatusBadge
                    label={m.status}
                    variant={isPaid ? 'success' : 'warning'}
                    size="sm"
                  />

                  {isPaid && m.receiptNumber && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      onClick={() => handleDownloadReceipt(m.receiptNumber)}
                    >
                      Receipt
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
