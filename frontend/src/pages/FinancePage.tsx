/**
 * =============================================================================
 * File: FinancePage.tsx
 * Module: Agency Operations Page
 * =============================================================================
 * Delivers full-scale wedding planning and coordination workspace for FinancePage, supporting real-time data inspection, filtering, and reporting.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState } from 'react';
import {
  ChangeOrder,
  VendorSettlement,
  Wedding,
  ClientPaymentSummary
} from '../types';
import { ChangeOrderManager } from '../components/domain/ChangeOrderManager';
import { ReconciliationShield } from '../components/domain/ReconciliationShield';
import { ClientPaymentManager } from '../components/domain/ClientPaymentManager';
import {
  Coins,
  CreditCard,
  FileText,
  Scale,
  Building,
} from 'lucide-react';

interface FinancePageProps {
  currentWedding: Wedding;
  weddingsList?: Wedding[];
  onSelectWedding?: (wedding: Wedding) => void;
  changeOrders: ChangeOrder[];
  settlements: VendorSettlement[];
  clientPaymentSummary?: ClientPaymentSummary;
  onDisbursePayment: (settlementId: string) => Promise<void> | void;
  onApproveChangeOrder: (orderId: string) => Promise<void> | void;
  onCreateChangeOrder?: (orderData: any) => Promise<void> | void;
  onRecordClientPayment?: (milestoneId: string, data: any) => Promise<void>;
}

/**
 * FinancePage component
 *
 * Analytic accounting module: change orders, client billing, and vendor reconciliation.
 */
export const FinancePage: React.FC<FinancePageProps> = ({
  currentWedding,
  weddingsList = [],
  onSelectWedding,
  changeOrders,
  settlements,
  clientPaymentSummary,
  onDisbursePayment,
  onApproveChangeOrder,
  onCreateChangeOrder,
  onRecordClientPayment
}) => {
  const [activeTab, setActiveTab] = useState<'clientPayments' | 'settlement' | 'changeOrders'>('clientPayments');

  // Fallback summary if not passed
  const summary: ClientPaymentSummary = clientPaymentSummary || {
    weddingId: currentWedding.id,
    totalContractValue: currentWedding.budgetMax || 35000000,
    totalExtrasBilled: 165000,
    totalGrossDue: (currentWedding.budgetMax || 35000000) + 165000,
    totalAmountPaid: 20000000,
    remainingBalanceDue: Math.max(0, (currentWedding.budgetMax || 35000000) + 165000 - 20000000),
    overallStatus: 'PARTIALLY_PAID',
    milestones: [
      {
        id: 'cpm-fallback-1',
        weddingId: currentWedding.id,
        type: 'BOOKING_DEPOSIT',
        title: 'Stage 1: Booking Deposit & Date Retainer (20%)',
        description: 'Secures venue reservation and lead director.',
        dueDate: '2026-08-10',
        amountDue: 5000000,
        amountPaid: 5000000,
        status: 'PAID',
        invoiceNumber: 'INV-TRK-001',
        paidAt: '2026-08-08',
        transactions: []
      },
      {
        id: 'cpm-fallback-2',
        weddingId: currentWedding.id,
        type: 'ADVANCE_PAYMENT',
        title: 'Stage 2: Operations Advance (40%)',
        description: 'Vendor lock-in disbursement.',
        dueDate: '2026-11-20',
        amountDue: 15000000,
        amountPaid: 15000000,
        status: 'PAID',
        invoiceNumber: 'INV-TRK-042',
        paidAt: '2026-11-19',
        transactions: []
      },
      {
        id: 'cpm-fallback-3',
        weddingId: currentWedding.id,
        type: 'FINAL_SETTLEMENT',
        title: 'Stage 3: Final Reconciled Settlement',
        description: 'Final bill plus approved scope changes (+60 guests, DJ).',
        dueDate: '2026-12-30',
        amountDue: 15165000,
        amountPaid: 0,
        status: 'PENDING',
        invoiceNumber: 'INV-TRK-099',
        transactions: []
      }
    ]
  };


  return (
    <div className="space-y-6">
      {/* Top Banner & Wedding Context */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Wedding Finance, Scope Additions & Reconciliation
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete client milestone billing, change orders (+60 guest plates, extra DJ hours, emergency generators), and 5-way vendor reconciliation protected by the Anti-Duplicate Shield.
          </p>
        </div>

        {/* Wedding Filter Selector */}
        {weddingsList.length > 0 && onSelectWedding && (
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Building className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600">Active Wedding:</span>
            <select
              value={currentWedding.id}
              onChange={e => {
                const found = weddingsList.find(w => w.id === e.target.value);
                if (found) onSelectWedding(found);
              }}
              className="text-xs font-serif font-bold bg-transparent text-[#0D1B2A] focus:outline-none cursor-pointer"
            >
              {weddingsList.map(w => (
                <option key={w.id} value={w.id}>
                  {w.coupleNames} ({w.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('clientPayments')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'clientPayments'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4 text-[#DFCA9B]" />
          <span>Client Payment Interface (3 Stages)</span>
        </button>

        <button
          onClick={() => setActiveTab('changeOrders')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'changeOrders'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>Additional Expenses & Scope (+60 Guests, DJ)</span>
        </button>

        <button
          onClick={() => setActiveTab('settlement')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'settlement'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Scale className="w-4 h-4 text-emerald-400" />
          <span>5-Way Vendor Reconciliation Shield</span>
        </button>
      </div>

      {/* Panels */}
      {activeTab === 'clientPayments' && (
        <ClientPaymentManager
          summary={summary}
          coupleNames={currentWedding.coupleNames}
          weddingTitle={currentWedding.location}
          onRecordPayment={onRecordClientPayment || (async () => {})}
        />
      )}

      {activeTab === 'changeOrders' && (
        <ChangeOrderManager
          weddingId={currentWedding.id}
          changeOrders={changeOrders}
          onApproveOrder={onApproveChangeOrder}
          onCreateOrder={onCreateChangeOrder}
        />
      )}

      {activeTab === 'settlement' && (
        <ReconciliationShield
          settlements={settlements}
          onDisbursePayment={onDisbursePayment}
        />
      )}
    </div>
  );
};
