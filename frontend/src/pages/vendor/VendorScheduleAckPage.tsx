import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  XCircle
} from 'lucide-react';

interface Directive {
  id: string;
  eventName: string;
  originalTime: string;
  revisedTime: string;
  delayMinutes: number;
  reason: string;
  issuedAt: string;
  issuedBy: string;
  status: 'SENT' | 'ACKNOWLEDGED' | 'PROBLEM';
  acknowledgedAt?: string;
  ackNote?: string;
  problemReason?: string;
}

/**
 * VendorScheduleAckPage component
 *
 * Vendor closed-loop schedule acknowledgement interface.
 */
export const VendorScheduleAckPage: React.FC = () => {
  const { user } = useAuth();

  // Local state initialized with live directive for SpiceHeaven
  const [directives, setDirectives] = useState<Directive[]>([
    {
      id: 'delay-dinner-service',
      eventName: 'Grand Royal Banquet Dinner Service',
      originalTime: '20:00 IST',
      revisedTime: '20:30 IST',
      delayMinutes: 30,
      reason: 'Baraat procession arrival and garland exchange took 30 mins longer due to royal elephant photo reception.',
      issuedAt: 'Today at 19:15 IST',
      issuedBy: 'Priya Mehra (Lead Luxury Director)',
      status: 'SENT'
    },
    {
      id: 'delay-welcome-drinks',
      eventName: 'Cocktail Welcome Drinks Service',
      originalTime: '18:30 IST',
      revisedTime: '18:45 IST',
      delayMinutes: 15,
      reason: 'Photography session at Mewar Terrace extended by family request.',
      issuedAt: 'Today at 18:00 IST',
      issuedBy: 'Siddharth Jain (Day-of Coordinator)',
      status: 'ACKNOWLEDGED',
      acknowledgedAt: 'Today at 18:08 IST',
      ackNote: 'Acknowledged. Hot canapés will be held in warming ovens until 18:40.'
    }
  ]);

  const [selectedDirective, setSelectedDirective] = useState<Directive | null>(null);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [ackNote, setAckNote] = useState('');
  const [problemReason, setProblemReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAckModal = (d: Directive) => {
    setSelectedDirective(d);
    setAckNote('Confirmed. Our culinary team has adjusted warming holding times accordingly.');
    setIsAckModalOpen(true);
  };

  const handleOpenProblemModal = (d: Directive) => {
    setSelectedDirective(d);
    setProblemReason('');
    setIsProblemModalOpen(true);
  };

  const handleConfirmAck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirective) return;
    setIsSubmitting(true);
    try {
      // Call real backend closed-loop API
      await api.acknowledgeDelayInstruction(selectedDirective.id, 'v-cater-01', ackNote);
      setDirectives(prev =>
        prev.map(d =>
          d.id === selectedDirective.id
            ? {
                ...d,
                status: 'ACKNOWLEDGED',
                acknowledgedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' IST',
                ackNote
              }
            : d
        )
      );
      setIsAckModalOpen(false);
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirective || !problemReason) return;
    setIsSubmitting(true);
    try {
      // Call real backend API
      await api.reportDelayProblem(selectedDirective.id, 'v-cater-01', problemReason);
      setDirectives(prev =>
        prev.map(d =>
          d.id === selectedDirective.id
            ? {
                ...d,
                status: 'PROBLEM',
                problemReason
              }
            : d
        )
      );
      setIsProblemModalOpen(false);
    } catch (err) {
      console.error('Failed to report problem:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = directives.filter(d => d.status === 'SENT').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Live Schedule Adjustments & Acknowledgement Board
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 2.4 & Scenario 4: Real-time closed-loop dispatch. The command centre tracks vendor compliance to prevent cascading wedding delays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
              <span>{pendingCount} Directive Awaiting Action</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All Directives Synchronized</span>
            </div>
          )}
        </div>
      </div>

      {/* Directives Feed */}
      <div className="space-y-4">
        {directives.map(directive => {
          const isSent = directive.status === 'SENT';
          const isAck = directive.status === 'ACKNOWLEDGED';
          const isProblem = directive.status === 'PROBLEM';

          return (
            <div
              key={directive.id}
              className={`rounded-2xl border p-6 transition-all shadow-xs ${
                isSent
                  ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300/40'
                  : isProblem
                  ? 'bg-rose-50/50 border-rose-300'
                  : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Directive #{directive.id}
                    </span>
                    {isSent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        ACTION REQUIRED
                      </span>
                    )}
                    {isAck && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        ACKNOWLEDGED
                      </span>
                    )}
                    {isProblem && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        CONFLICT REPORTED
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
                    {directive.eventName}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Issued by</div>
                  <div className="text-xs font-bold text-[#0D1B2A]">{directive.issuedBy}</div>
                  <div className="text-[11px] text-slate-400">{directive.issuedAt}</div>
                </div>
              </div>

              {/* Time Change Comparison Banner */}
              <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">Original Timing</div>
                    <div className="text-sm font-bold text-slate-500 line-through">
                      {directive.originalTime}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-[11px] text-emerald-700 font-medium">Revised Timing</div>
                    <div className="text-base font-bold text-[#0D1B2A] flex items-center gap-1.5">
                      <span>{directive.revisedTime}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        +{directive.delayMinutes}m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="max-w-md text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <strong className="text-slate-800">Operational Reason:</strong> {directive.reason}
                </div>
              </div>

              {/* Acknowledged Response Note if completed */}
              {isAck && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-950">
                      Acknowledged at {directive.acknowledgedAt}
                    </p>
                    <p className="text-emerald-800 mt-0.5">{directive.ackNote}</p>
                  </div>
                </div>
              )}

              {/* Problem Note if reported */}
              {isProblem && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-rose-950">Conflict Reported to Command Centre</p>
                    <p className="text-rose-800 mt-0.5">{directive.problemReason}</p>
                    <p className="text-[11px] text-rose-600 mt-1">Lead coordinator has been paged immediately.</p>
                  </div>
                </div>
              )}

              {/* Action Buttons for SENT */}
              {isSent && (
                <div className="mt-5 pt-4 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-amber-900 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Please confirm your readiness for the adjusted dinner timetable.</span>
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-300 text-rose-700 hover:bg-rose-50"
                      onClick={() => handleOpenProblemModal(directive)}
                    >
                      Report Conflict / Inability
                    </Button>
                    <Button
                      variant="gold"
                      size="sm"
                      leftIcon={<Check className="w-4 h-4" />}
                      onClick={() => handleOpenAckModal(directive)}
                    >
                      Acknowledge Directive
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Acknowledge */}
      <Modal
        isOpen={isAckModalOpen}
        onClose={() => setIsAckModalOpen(false)}
        title="Confirm Schedule Directive Acknowledgment"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmAck} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800">{selectedDirective?.eventName}</div>
            <div className="text-slate-600">
              Revised timing: <strong className="text-[#0D1B2A]">{selectedDirective?.revisedTime}</strong> (+{selectedDirective?.delayMinutes} min shift)
            </div>
          </div>

          <FormField label="Operational Note / Preparedness Confirmation">
            <textarea
              value={ackNote}
              onChange={e => setAckNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              placeholder="e.g. Confirmed. Warming cabinets engaged, buffet will be ready at 20:30 sharp."
              required
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAckModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={isSubmitting}
            >
              Submit Acknowledgment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Report Problem */}
      <Modal
        isOpen={isProblemModalOpen}
        onClose={() => setIsProblemModalOpen(false)}
        title="Report Schedule Conflict to Command Centre"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmProblem} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
            <div className="font-bold">Immediate Coordinator Alert</div>
            <div>
              Reporting a conflict will escalate to Lead Planner Priya Mehra and the live event command centre.
            </div>
          </div>

          <FormField label="Describe Conflict or Inability to Comply">
            <textarea
              value={problemReason}
              onChange={e => setProblemReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="e.g. Cannot delay past 20:30 due to soufflé and fresh seafood holding limits."
              required
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProblemModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="bg-rose-600 text-white hover:bg-rose-700 border-transparent"
              loading={isSubmitting}
            >
              Escalate to Command Centre
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
