import React from 'react';
import { TimelineDelay } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Clock, AlertCircle, CheckCircle2, Phone, ArrowRight, ShieldAlert, Sparkles, Send } from 'lucide-react';

interface DelayAckBoardProps {
  delays: TimelineDelay[];
  onAcknowledgeInstruction: (delayId: string, vendorId: string) => void;
}

/**
 * DelayAckBoard component
 *
 * Closed-loop schedule change acknowledgement board tracking real-time vendor receipt.
 */
export const DelayAckBoard: React.FC<DelayAckBoardProps> = ({
  delays,
  onAcknowledgeInstruction
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
      {/* Header & Closed-Loop Differentiation Explanation */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
                Closed-Loop Schedule Changes & Vendor Acknowledgement
                <span className="text-[10px] font-sans font-bold bg-[#C5A059]/20 text-[#9D7C36] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Core Differentiator
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                When an activity shifts, the system identifies affected vendors, dispatches targeted instructions, and tracks real-time receipt: <span className="font-semibold text-amber-700">Sent</span> $\rightarrow$ <span className="font-semibold text-emerald-700">Acknowledged</span> $\rightarrow$ <span className="font-semibold text-rose-700">Problem</span>. A sent notification never automatically counts as acknowledged.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delays List */}
      <div className="space-y-6">
        {delays.map(delay => {
          const totalVendors = delay.affectedVendors.length;
          const acknowledgedCount = delay.affectedVendors.filter(v => v.status === 'ACKNOWLEDGED').length;
          const isFullyResolved = acknowledgedCount === totalVendors;

          return (
            <div
              key={delay.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 space-y-4 shadow-2xs"
            >
              {/* Delay Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200/80 rounded-xl p-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span className="font-serif font-bold text-sm text-[#0D1B2A]">
                      {delay.activityName} Delayed by +{delay.delayMinutes} Minutes
                    </span>
                    <StatusBadge
                      label={isFullyResolved ? 'ALL ACKNOWLEDGED' : `${totalVendors - acknowledgedCount} VENDOR(S) PENDING ACK`}
                      variant={isFullyResolved ? 'success' : 'warning'}
                      pulsing={!isFullyResolved}
                      size="sm"
                    />
                  </div>
                  <p className="text-xs text-slate-600 pl-6">
                    <span className="font-semibold">Reason:</span> {delay.reason} | <span className="font-semibold">Authorized by:</span> {delay.approvedByPlanner}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono font-bold">
                  <span className="text-slate-400 line-through">{delay.originalPlannedTime}</span>
                  <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                  <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md">
                    Revised: {delay.revisedTime}
                  </span>
                </div>
              </div>

              {/* Affected Vendors List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
                  <span>Impacted Vendors & Directives ({totalVendors})</span>
                  <span>{acknowledgedCount} of {totalVendors} Confirmed</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {delay.affectedVendors.map(vendor => {
                    const isAck = vendor.status === 'ACKNOWLEDGED';
                    const isWaiting = vendor.status === 'SENT';

                    return (
                      <div
                        key={vendor.vendorId}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                          isAck
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : 'bg-white border-amber-300 ring-1 ring-amber-300/40 shadow-xs'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-xs text-[#0D1B2A]">{vendor.vendorName}</h4>
                              <p className="text-[11px] text-slate-500">{vendor.category} • {vendor.phone}</p>
                            </div>
                            <StatusBadge
                              label={isAck ? 'ACKNOWLEDGED' : 'WAITING (SENT)'}
                              variant={isAck ? 'success' : 'warning'}
                              size="sm"
                            />
                          </div>

                          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-xs text-slate-700">
                            <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">
                              Specific Directive:
                            </span>
                            "{vendor.instruction}"
                          </div>

                          {vendor.responseNote && (
                            <div className="text-[11px] text-emerald-800 bg-emerald-50/50 p-2 rounded-md border border-emerald-100 flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{vendor.responseNote} ({vendor.acknowledgedAt})</span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Acknowledgement Trigger for Demo / Testing */}
                        {isWaiting && (
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400 italic">
                              Dispatched at {vendor.notifiedAt}
                            </span>
                            <button
                              onClick={() => onAcknowledgeInstruction(delay.id, vendor.vendorId)}
                              className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-[11px] font-semibold py-1.5 px-3 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Record Vendor Ack</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
