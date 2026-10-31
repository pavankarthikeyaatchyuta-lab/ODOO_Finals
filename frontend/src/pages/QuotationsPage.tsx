/**
 * =============================================================================
 * File: QuotationsPage.tsx
 * Module: Agency Operations Page
 * =============================================================================
 * Delivers full-scale wedding planning and coordination workspace for QuotationsPage, supporting real-time data inspection, filtering, and reporting.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React from 'react';
import { CatererQuote, Wedding } from '../types';
import { QuoteComparisonMatrix } from '../components/domain/QuoteComparisonMatrix';
import { Lock, FileSpreadsheet, ShieldAlert } from 'lucide-react';

interface QuotationsPageProps {
  quotes: CatererQuote[];
  currentWedding: Wedding;
  onSelectWinner: (quoteId: string) => void;
  onNavigateToTab: (tab: any) => void;
}

/**
 * QuotationsPage component
 *
 * RFQ management hub and 3-caterer decision comparison matrix.
 */
export const QuotationsPage: React.FC<QuotationsPageProps> = ({
  quotes,
  currentWedding,
  onSelectWinner,
  onNavigateToTab
}) => {
  const isGated = !currentWedding.agreementSigned;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Vendor Directory & Quotation Comparison
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scenario 2: Compare 3 caterer bids side by side for 400 guests. Selecting one automatically locks the agreed price and closes the others.
          </p>
        </div>
      </div>

      {/* Gated Access Check */}
      {isGated ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
              Vendor Quotations Are Gated
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with The Royal Knot operational policy, proprietary vendor pricing and comparative quotes cannot be released until the couple's digital service agreement is authenticated.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('enquiries')}
            className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-2 px-5 rounded-xl shadow-xs transition-colors"
          >
            Review & Sign Agreement in Enquiries →
          </button>
        </div>
      ) : (
        <QuoteComparisonMatrix quotes={quotes} onSelectWinner={onSelectWinner} />
      )}
    </div>
  );
};
