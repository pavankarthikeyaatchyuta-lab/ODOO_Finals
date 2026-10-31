/**
 * =============================================================================
 * File: ClientPaymentManager.tsx
 * Module: Domain-Specific Workflow Component
 * =============================================================================
 * Specialized operational module (ClientPaymentManager) supporting interactive wedding workflows like RFQ comparison, change orders, run-sheet, or settlements.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState } from 'react';
import { ClientPaymentSummary, ClientPaymentMilestone } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { StatusBadge } from '../common/StatusBadge';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  PlusCircle,
  FileText,
  Calendar,
  Building,
  ArrowUpRight,
  ShieldCheck,
  X
} from 'lucide-react';

interface ClientPaymentManagerProps {
  summary: ClientPaymentSummary;
  coupleNames?: string;
  weddingTitle?: string;
  onRecordPayment: (
    milestoneId: string,
    data: {
      amount: number;
      method: 'RTGS' | 'NEFT' | 'IMPS' | 'CHEQUE' | 'BANK_TRANSFER';
      reference: string;
      notes?: string;
    }
  ) => Promise<void>;
}

/**
 * ClientPaymentManager component
 *
 * Client milestone payment tracker with receipt logging and balance calculation.
 */
export const ClientPaymentManager: React.FC<ClientPaymentManagerProps> = ({
  summary,
  coupleNames = 'Rahul Sharma & Ananya Singh',
  weddingTitle = 'The Royal Heritage Wedding at Jagmandir Palace',
  onRecordPayment
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<ClientPaymentMilestone | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'RTGS' | 'NEFT' | 'IMPS' | 'CHEQUE' | 'BANK_TRANSFER'>('RTGS');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openPaymentModal = (milestone: ClientPaymentMilestone) => {
    setSelectedMilestone(milestone);
    const balanceRemaining = Math.max(0, milestone.amountDue - milestone.amountPaid);
    setPaymentAmount(balanceRemaining);
    setPaymentReference(`RTGS/TRK/${Date.now().toString().slice(-6)}`);
    setPaymentNotes('');
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone || paymentAmount <= 0) return;

    setSubmitting(true);
    try {
      await onRecordPayment(selectedMilestone.id, {
        amount: Number(paymentAmount),
        method: paymentMethod,
        reference: paymentReference,
        notes: paymentNotes
      });
      setPaymentModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: ClientPaymentMilestone['status']) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIALLY_PAID':
        return 'info';
      case 'OVERDUE':
        return 'danger';
      default:
        return 'warning';
    }
  };

  // Collect all transactions across milestones for the comprehensive history
  const allTransactions = summary.milestones.flatMap(m =>
    m.transactions.map(t => ({
      ...t,
      milestoneTitle: m.title,
      invoiceNumber: m.invoiceNumber
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#C5A059]" />
              <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
                Client Payment Schedule & Milestone Ledger
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {coupleNames} • {weddingTitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Billing Lifecycle:</span>
            <StatusBadge
              label={summary.overallStatus === 'PAID' ? 'FULLY PAID' : 'PARTIALLY SETTLED'}
              variant={summary.overallStatus === 'PAID' ? 'success' : 'warning'}
              size="sm"
            />
          </div>
        </div>

        {/* 4 Financial Pillar Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              1. Base Contract Value
            </span>
            <CurrencyDisplay amount={summary.totalContractValue} className="text-lg text-slate-800" />
            <span className="text-[10px] text-slate-500 block mt-0.5">Agreed in signed agreement</span>
          </div>

          <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              2. Approved Extras Billed
            </span>
            <CurrencyDisplay amount={summary.totalExtrasBilled} className="text-lg text-emerald-800" />
            <span className="text-[10px] text-emerald-600 block mt-0.5">Cascaded from change orders</span>
          </div>

          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
              3. Total Amount Received
            </span>
            <CurrencyDisplay amount={summary.totalAmountPaid} className="text-lg text-blue-900" />
            <span className="text-[10px] text-blue-600 block mt-0.5">Verified bank remittances</span>
          </div>

          <div className="p-3.5 bg-[#0D1B2A] text-white rounded-xl border border-[#C5A059]/40 shadow-xs">
            <span className="text-[11px] font-semibold text-[#DFCA9B] uppercase tracking-wider block">
              4. Total Balance Due
            </span>
            <CurrencyDisplay amount={summary.remainingBalanceDue} className="text-lg text-white" />
            <span className="text-[10px] text-slate-300 block mt-0.5">Due at final post-event audit</span>
          </div>
        </div>
      </div>

      {/* 3 Milestone Cards: Booking, Advance, Final */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#C5A059]" />
            <span>Three-Tier Milestone Payment Schedule</span>
          </h4>
          <span className="text-xs text-slate-400 font-mono">Governed by Signed Digital Contract</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {summary.milestones.map((m, index) => {
            const isFullyPaid = m.status === 'PAID';
            const pendingAmount = Math.max(0, m.amountDue - m.amountPaid);
            const percentPaid = Math.min(100, Math.round((m.amountPaid / m.amountDue) * 100));

            return (
              <div
                key={m.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  isFullyPaid
                    ? 'bg-emerald-50/20 border-emerald-200'
                    : 'bg-white border-slate-200/90 shadow-xs hover:border-[#C5A059]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                        Milestone 0{index + 1} • {m.invoiceNumber}
                      </span>
                      <h5 className="font-serif font-bold text-sm text-[#0D1B2A] mt-0.5">{m.title}</h5>
                    </div>
                    <StatusBadge
                      label={m.status}
                      variant={getStatusBadgeVariant(m.status)}
                      size="sm"
                    />
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>

                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Amount Due:</span>
                      <CurrencyDisplay amount={m.amountDue} className="font-bold text-slate-800" />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Amount Paid:</span>
                      <CurrencyDisplay amount={m.amountPaid} className="font-bold text-emerald-700" />
                    </div>

                    {pendingAmount > 0 && (
                      <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-1.5 font-semibold">
                        <span className="text-slate-600">Balance Pending:</span>
                        <CurrencyDisplay amount={pendingAmount} className="text-rose-700 font-bold" />
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Collection Progress</span>
                      <span className="font-mono font-bold">{percentPaid}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFullyPaid ? 'bg-emerald-500' : 'bg-[#C5A059]'
                        }`}
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due Date: <strong className="text-slate-700">{m.dueDate}</strong></span>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  {isFullyPaid ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Settled on {m.paidAt || 'Confirmed'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => openPaymentModal(m)}
                      className="w-full bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Record Client Remittance</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History & Audit Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C5A059]" />
              <span>Client Payment Audit Ledger ({allTransactions.length} Remittances)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative transaction logs with official bank reference identifiers.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Bank-Reconciled</span>
          </div>
        </div>

        {allTransactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
            No payments recorded yet for this wedding.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Receipt / Txn ID</th>
                  <th className="py-2.5 px-3">Milestone</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Method & Bank Reference</th>
                  <th className="py-2.5 px-3">Received By</th>
                  <th className="py-2.5 px-3 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allTransactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-800">{txn.receiptNumber}</span>
                      <span className="block text-[10px] text-slate-400">{txn.id}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700 block">{txn.milestoneTitle}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{txn.invoiceNumber}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{txn.date}</td>
                    <td className="py-3 px-3">
                      <span className="inline-block bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px] font-mono mr-2">
                        {txn.method}
                      </span>
                      <span className="font-mono text-slate-800 text-[11px]">{txn.reference}</span>
                      {txn.notes && <p className="text-[10px] text-slate-400 mt-0.5">{txn.notes}</p>}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{txn.receivedBy}</td>
                    <td className="py-3 px-3 text-right">
                      <CurrencyDisplay amount={txn.amount} className="font-bold text-emerald-700 text-sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Client Remittance */}
      {paymentModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 bg-[#0D1B2A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                  Record Client Payment Remittance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedMilestone.title} ({selectedMilestone.invoiceNumber})
                </p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Milestone Amount:</span>
                  <CurrencyDisplay amount={selectedMilestone.amountDue} className="font-bold text-slate-800" />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Previously Paid:</span>
                  <CurrencyDisplay amount={selectedMilestone.amountPaid} className="font-bold text-emerald-700" />
                </div>
                <div className="flex justify-between font-semibold border-t border-slate-200/80 pt-1">
                  <span className="text-slate-700">Remaining Balance Due:</span>
                  <CurrencyDisplay
                    amount={Math.max(0, selectedMilestone.amountDue - selectedMilestone.amountPaid)}
                    className="text-rose-700 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remittance Amount (₹ INR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={Math.max(1, selectedMilestone.amountDue - selectedMilestone.amountPaid)}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full text-sm font-semibold border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  >
                    <option value="RTGS">RTGS (Real-Time Gross Settlement)</option>
                    <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                    <option value="IMPS">IMPS (Immediate Payment Service)</option>
                    <option value="BANK_TRANSFER">Direct Corporate Wire</option>
                    <option value="CHEQUE">Payee Account Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Reference / UTR Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="e.g. RTGS/HDFC/88129031"
                    className="w-full text-xs font-mono border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remittance Notes / Authorization
                </label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Transferred from Family Trust account. Verified against bank statement."
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{submitting ? 'Recording Remittance...' : 'Confirm & Log Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
