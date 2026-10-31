import React from 'react';
import { CatererQuote } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { StatusBadge } from '../common/StatusBadge';
import { Check, CheckCircle2, XCircle, Award, Sparkles, ChefHat } from 'lucide-react';

interface QuoteComparisonMatrixProps {
  quotes: CatererQuote[];
  onSelectWinner: (quoteId: string) => void;
  isLocked?: boolean;
}

export const QuoteComparisonMatrix: React.FC<QuoteComparisonMatrixProps> = ({
  quotes,
  onSelectWinner,
  isLocked = false
}) => {
  return (
    <div className="space-y-4">
      {/* Scenario Explanatory Banner */}
      <div className="bg-gradient-to-r from-[#F5F1E8] to-white p-4 rounded-xl border border-[#C5A059]/30 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-[#C5A059]" />
            <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
              Three Caterers, One Decision — RFQ Comparison Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Evaluating 3 regional caterer proposals for 400 guests side-by-side. Selecting the winning caterer automatically binds them to the wedding ledger and closes the competing proposals as <span className="font-semibold text-rose-700">Rejected</span>.
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Target Guest Count
          </span>
          <span className="text-lg font-bold text-[#1B3B6F]">400 Guests</span>
        </div>
      </div>

      {/* Side-by-Side 3-Column Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {quotes.map((quote) => {
          const isWinner = quote.status === 'SELECTED';
          const isRejected = quote.status === 'REJECTED';

          return (
            <div
              key={quote.id}
              className={`relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                isWinner
                  ? 'border-[#C5A059] ring-2 ring-[#C5A059]/40 shadow-xl'
                  : isRejected
                  ? 'border-slate-200 opacity-75 bg-slate-50/50'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md'
              }`}
            >
              {/* Winner Gold Badge */}
              {isWinner && (
                <div className="bg-gradient-to-r from-[#DFCA9B] to-[#C5A059] text-[#0D1B2A] text-xs font-bold py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-1.5 shadow-xs">
                  <Award className="w-4 h-4 fill-[#0D1B2A]" />
                  <span>OFFICIAL SELECTED CATERER</span>
                </div>
              )}

              {/* Rejected Tag */}
              {isRejected && (
                <div className="bg-slate-200 text-slate-600 text-xs font-semibold py-1 px-4 text-center tracking-wider">
                  AUTO-REJECTED / CLOSED
                </div>
              )}

              <div className="p-5 space-y-4 flex-1">
                {/* Header */}
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif font-bold text-base text-[#0D1B2A] leading-snug">
                      {quote.vendorName}
                    </h4>
                    <StatusBadge
                      label={quote.status}
                      variant={isWinner ? 'success' : isRejected ? 'danger' : 'warning'}
                      size="sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Submitted: {quote.submittedDate}</p>
                </div>

                {/* Primary Pricing Metrics */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-slate-600">Price per Plate:</span>
                    <CurrencyDisplay amount={quote.pricePerPlate} className="text-lg text-[#1B3B6F]" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Base Food (400 × {quote.pricePerPlate}):</span>
                    <CurrencyDisplay amount={quote.foodBaseCost} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Extra-Hour Surcharge:</span>
                    <span className="font-mono font-semibold">₹{quote.extraHourRate.toLocaleString('en-IN')}/hr</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Inclusions & Extras:</span>
                    <CurrencyDisplay amount={quote.additionalCharges} />
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 flex items-baseline justify-between font-bold text-sm">
                    <span className="text-slate-800">Total Agreed Quote:</span>
                    <CurrencyDisplay amount={quote.totalAmount} className="text-base text-[#0D1B2A]" />
                  </div>
                </div>

                {/* Regional Menu Specialties */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <span>Menu Highlights</span>
                    <span className="text-[#C5A059] font-semibold">{quote.liveCountersCount} Live Counters</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {quote.menuSpecialties.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Inclusions */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Service Inclusions:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {quote.inclusions.map((inc, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exclusions */}
                {quote.exclusions.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Exclusions:</p>
                    <ul className="text-xs text-slate-500 space-y-1">
                      {quote.exclusions.map((exc, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100">
                {isWinner ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Contract Awarded & Bound to Ledger</span>
                  </div>
                ) : isRejected ? (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 py-2.5 font-medium">
                    <XCircle className="w-4 h-4 text-slate-400" />
                    <span>Proposal Closed</span>
                  </div>
                ) : (
                  <button
                    disabled={isLocked}
                    onClick={() => onSelectWinner(quote.id)}
                    className="w-full bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4 text-[#C5A059]" />
                    <span>Select Winning Caterer</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
