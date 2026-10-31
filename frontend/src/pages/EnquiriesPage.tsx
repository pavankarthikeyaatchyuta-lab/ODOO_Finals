import React, { useState } from 'react';
import { Enquiry } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  MessageSquareHeart,
  Calendar,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  User,
  Sparkles,
  Phone,
  Mail,
  Plus
} from 'lucide-react';

interface EnquiriesPageProps {
  enquiries: Enquiry[];
  onSignAgreement: (enquiryId: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const EnquiriesPage: React.FC<EnquiriesPageProps> = ({
  enquiries,
  onSignAgreement,
  onNavigateToTab
}) => {
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry>(enquiries[1] || enquiries[0]);
  const [showSignModal, setShowSignModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Enquiry Capture & Digital Agreement Gating
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scenario 1: Couple captures winter destination wedding details (date, 400 guests, theme, budget). Service agreement must be signed before vendor lists or floor plans are shared.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge label="Gating Engine Active" variant="info" size="sm" />
        </div>
      </div>

      {/* Grid: Enquiry List (Left) + Detail & Agreement Gate (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Enquiries Pipeline List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-serif font-bold text-sm text-[#0D1B2A]">
              All Enquiries ({enquiries.length})
            </h3>
            <span className="text-[11px] text-slate-400">Jaipur & Udaipur</span>
          </div>

          <div className="space-y-2.5">
            {enquiries.map(enq => {
              const isSelected = selectedEnquiry?.id === enq.id;
              const isSigned = enq.agreementSigned;

              return (
                <div
                  key={enq.id}
                  onClick={() => setSelectedEnquiry(enq)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#C5A059] bg-[#F5F1E8]/40 ring-1 ring-[#C5A059]/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-[#0D1B2A]">{enq.coupleName}</h4>
                    <StatusBadge
                      label={enq.status.replace('_', ' ')}
                      variant={isSigned ? 'success' : 'warning'}
                      size="sm"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1">{enq.theme}</p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>{enq.guestCount} Guests</span>
                    <CurrencyDisplay amount={enq.budgetMax} format="compact" className="text-[#1B3B6F]" />
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold">
                    {isSigned ? (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        Agreement Signed (Unlocked)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-700">
                        <Lock className="w-3 h-3 text-rose-600" />
                        Vendors Gated (Unsigned)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Enquiry Detailed Dossier & Agreement Gate */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEnquiry ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 font-bold">{selectedEnquiry.id}</span>
                    <StatusBadge label={selectedEnquiry.packageType.replace('_', ' ')} variant="info" size="sm" />
                  </div>
                  <h3 className="font-serif font-bold text-xl text-[#0D1B2A] mt-1">
                    {selectedEnquiry.coupleName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedEnquiry.phone}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedEnquiry.email}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block">Maximum Budget</span>
                  <CurrencyDisplay amount={selectedEnquiry.budgetMax} format="crores" showDecimals className="text-xl text-[#1B3B6F]" />
                </div>
              </div>

              {/* Requirement Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Target Date:</span>
                  <span className="font-bold text-slate-800">{selectedEnquiry.targetDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Guest Count:</span>
                  <span className="font-bold text-slate-800">{selectedEnquiry.guestCount} Guests</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Design Theme:</span>
                  <span className="font-bold text-slate-800">{selectedEnquiry.theme}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Planner:</span>
                  <span className="font-bold text-[#1B3B6F]">{selectedEnquiry.assignedPlanner}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="text-xs text-slate-600 bg-[#FBF9F5] p-3.5 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-800 block mb-1">First Consultation Brief:</span>
                {selectedEnquiry.notes}
              </div>

              {/* THE CORE GATING MECHANISM */}
              <div className={`p-5 rounded-2xl border transition-all ${
                selectedEnquiry.agreementSigned
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : 'bg-rose-50/30 border-rose-300'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {selectedEnquiry.agreementSigned ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Lock className="w-5 h-5 text-rose-600" />
                      )}
                      <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">
                        {selectedEnquiry.agreementSigned
                          ? 'Digital Service Agreement: SIGNED & VERIFIED'
                          : 'Digital Service Agreement: PENDING SIGNATURE (ACCESS GATED)'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600">
                      {selectedEnquiry.agreementSigned
                        ? 'The digital service agreement has been authenticated via mobile e-signature. Vendor shortlists, pricing RFQs, and floor plan layouts are unlocked.'
                        : 'Rule Enforced: Proprietary vendor databases and custom venue floor plans remain strictly locked until the client digitally signs the agreement.'}
                    </p>
                  </div>

                  {selectedEnquiry.agreementSigned ? (
                    <button
                      onClick={() => onNavigateToTab('quotations')}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors shrink-0"
                    >
                      View Unlocked Quotes →
                    </button>
                  ) : (
                    <button
                      onClick={() => onSignAgreement(selectedEnquiry.id)}
                      className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <span>Simulate Mobile E-Signature</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select an enquiry to review details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
