/**
 * =============================================================================
 * File: VendorInvoicesPage.tsx
 * Module: Vendor Partner Extranet View
 * =============================================================================
 * Provides authenticated vendor extranet capabilities for VendorInvoicesPage, including arrival schedules, 1-click delay acknowledgments, and invoicing.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState } from 'react';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { Input } from '../../components/common/Input';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  UploadCloud,
  FileCheck2,
  Download,
  AlertCircle,
  Building,
  CreditCard
} from 'lucide-react';

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  type: 'ADVANCE' | 'EXTRA_PLATES' | 'FINAL_SETTLEMENT';
  description: string;
  amount: number;
  submittedAt: string;
  status: 'DISBURSED' | 'AUDIT_VERIFIED' | 'SUBMITTED';
  referenceId: string;
}

/**
 * VendorInvoicesPage component
 *
 * Vendor final invoice submission and settlement status tracker.
 */
export const VendorInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([
    {
      id: 'inv-001',
      invoiceNumber: 'SH-2026-INV-089',
      type: 'ADVANCE',
      description: 'Initial 33% Procurement & Raw Ingredient Deposit',
      amount: 400000,
      submittedAt: '2026-10-15',
      status: 'DISBURSED',
      referenceId: 'UTR-HDFC-99128381'
    },
    {
      id: 'inv-002',
      invoiceNumber: 'SH-2026-CO-012',
      type: 'EXTRA_PLATES',
      description: 'Change Order #CO-001 (+60 Guests at ₹2,500/plate)',
      amount: 150000,
      submittedAt: '2026-10-28',
      status: 'AUDIT_VERIFIED',
      referenceId: 'PENDING_FINAL_RUN'
    }
  ]);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newInvNum, setNewInvNum] = useState('SH-2026-FINAL-092');
  const [newAmount, setNewAmount] = useState('800000');
  const [newDesc, setNewDesc] = useState('Final Execution Bill for Grand Royal Banquet (400 Base + 60 Extra)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const created: InvoiceRecord = {
        id: `inv-${Date.now()}`,
        invoiceNumber: newInvNum,
        type: 'FINAL_SETTLEMENT',
        description: newDesc,
        amount: parseFloat(newAmount) || 800000,
        submittedAt: new Date().toISOString().split('T')[0],
        status: 'SUBMITTED',
        referenceId: 'AUDIT_IN_PROGRESS'
      };
      setInvoices(prev => [created, ...prev]);
      setIsSubmitting(false);
      setIsSubmitModalOpen(false);
    }, 500);
  };

  const totalContract = 1200000;
  const approvedExtras = 150000;
  const totalAgreed = totalContract + approvedExtras;
  const totalDisbursed = 400000;
  const netDue = totalAgreed - totalDisbursed;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Vendor Invoices & Bank Disbursements
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 2.5: Guaranteed transparent settlement. View approved purchase orders, advances disbursed, and submit your final execution bill.
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          leftIcon={<UploadCloud className="w-4 h-4" />}
          onClick={() => setIsSubmitModalOpen(true)}
        >
          Submit Final Invoice
        </Button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Agreed RFQ PO</div>
          <div className="text-xl font-bold font-serif text-[#0D1B2A] mt-1">
            <CurrencyDisplay amount={totalContract} />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">PO #TRK-2026-CAT-01</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Approved Additions</div>
          <div className="text-xl font-bold font-serif text-blue-600 mt-1">
            <CurrencyDisplay amount={approvedExtras} />
          </div>
          <div className="text-[11px] text-blue-600 mt-1">+60 Guests Approved Change Order</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Advance Disbursed</div>
          <div className="text-xl font-bold font-serif text-emerald-600 mt-1">
            <CurrencyDisplay amount={totalDisbursed} />
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">Settled on 15 Oct via RTGS</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Remaining Payable</div>
          <div className="text-xl font-bold font-serif text-[#C5A059] mt-1">
            <CurrencyDisplay amount={netDue} />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Payable within 48h of wedding</div>
        </div>
      </div>

      {/* Invoice History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
            Invoice & Disbursement History
          </h3>
          <span className="text-xs text-slate-400">Strict Anti-Duplicate Disbursal Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium">
                <th className="pb-3 font-semibold">Invoice #</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Bank Reference / UTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 font-bold text-[#0D1B2A]">{inv.invoiceNumber}</td>
                  <td className="py-3.5 text-slate-600 max-w-xs">{inv.description}</td>
                  <td className="py-3.5 font-bold text-slate-900">
                    <CurrencyDisplay amount={inv.amount} />
                  </td>
                  <td className="py-3.5 text-slate-500">{inv.submittedAt}</td>
                  <td className="py-3.5">
                    <StatusBadge
                      label={
                        inv.status === 'DISBURSED'
                          ? 'DISBURSED'
                          : inv.status === 'AUDIT_VERIFIED'
                          ? 'AUDITED & APPROVED'
                          : 'SUBMITTED'
                      }
                      variant={
                        inv.status === 'DISBURSED'
                          ? 'success'
                          : inv.status === 'AUDIT_VERIFIED'
                          ? 'info'
                          : 'warning'
                      }
                      size="sm"
                    />
                  </td>
                  <td className="py-3.5 font-mono text-[11px] text-slate-600">
                    {inv.referenceId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Submit Final Invoice */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Final Execution Invoice"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitInvoice} className="space-y-4">
          <FormField label="Invoice Number">
            <Input
              value={newInvNum}
              onChange={e => setNewInvNum(e.target.value)}
              placeholder="e.g. SH-2026-FINAL-092"
              required
            />
          </FormField>

          <FormField label="Claimed Amount (INR)">
            <Input
              type="number"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              placeholder="800000"
              required
            />
          </FormField>

          <FormField label="Service Scope / Deliverables Completed">
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              required
            />
          </FormField>

          <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center cursor-pointer hover:border-[#C5A059]">
            <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <div className="text-xs font-semibold text-slate-700">Attach Signed Tax Invoice (PDF)</div>
            <div className="text-[10px] text-slate-400">PDF, max 10MB</div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={isSubmitting}
            >
              Submit for Finance Audit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
