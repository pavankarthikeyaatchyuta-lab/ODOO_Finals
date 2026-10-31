import React, { useState, useEffect, useMemo } from 'react';
import {
  RunSheetItem,
  VendorArrival,
  TimelineDelay,
  Incident,
  AffectedVendorInstruction
} from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import {
  Radio,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  PlusCircle,
  ShieldAlert,
  Flame,
  ArrowRight,
  Send,
  User,
  MapPin,
  History,
  FileCheck2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';

interface CommandCentrePageProps {
  runSheet: RunSheetItem[];
  arrivals: VendorArrival[];
  delays: TimelineDelay[];
  incidents: Incident[];
  onCheckinVendor: (arrivalId: string) => void;
  onAcknowledgeInstruction: (delayId: string, vendorId: string, note?: string) => void;
  onReportDelayProblem?: (delayId: string, vendorId: string, note: string) => void;
  onResolveIncident: (incidentId: string, note: string) => void;
  onProposeScheduleChange?: (data: any) => Promise<any>;
  onApproveScheduleChange?: (delayId: string, approver: string) => Promise<any>;
  onPublishScheduleChange?: (delayId: string) => Promise<any>;
  onCreateIncident?: (incident: any) => Promise<any>;
  onUpdateRunSheetItem?: (id: string, updates: Partial<RunSheetItem>) => Promise<any>;
}

type CommandSubTab = 'timeline' | 'arrivals' | 'incidents' | 'delays' | 'history';

/**
 * CommandCentrePage component
 *
 * Day-of execution cockpit: run-sheets, vendor check-ins, delays, and incidents.
 */
export const CommandCentrePage: React.FC<CommandCentrePageProps> = ({
  runSheet,
  arrivals,
  delays,
  incidents,
  onCheckinVendor,
  onAcknowledgeInstruction,
  onReportDelayProblem,
  onResolveIncident,
  onProposeScheduleChange,
  onApproveScheduleChange,
  onPublishScheduleChange,
  onCreateIncident,
  onUpdateRunSheetItem
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CommandSubTab>('timeline');
  const [currentTimeStr, setCurrentTimeStr] = useState('17:15:00');

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Modals
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedIncidentForResolve, setSelectedIncidentForResolve] = useState<Incident | null>(null);
  const [incidentResolutionNote, setIncidentResolutionNote] = useState('Issue rectified and verified by operations team.');

  // Schedule Change Workflow Modal
  const [isScheduleChangeModalOpen, setIsScheduleChangeModalOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(runSheet[2]?.id || runSheet[0]?.id || '');
  const [delayMinutes, setDelayMinutes] = useState<number>(25);
  const [delayReason, setDelayReason] = useState('Bride procession vehicle traffic hold at Hathipole & makeup touch-up');
  const [requesterName, setRequesterName] = useState('Priya Mehra (Lead Luxury Director)');

  // Vendor Problem Report Modal
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [problemDelayId, setProblemDelayId] = useState('');
  const [problemVendorId, setProblemVendorId] = useState('');
  const [problemVendorName, setProblemVendorName] = useState('');
  const [problemNoteInput, setProblemNoteInput] = useState('Kitchen banquet holding window maximum 30 mins before food quality degrades.');

  // New Incident Form State
  const [newIncTitle, setNewIncTitle] = useState('');
  const [newIncCategory, setNewIncCategory] = useState<Incident['category']>('VENDOR_DELAY');
  const [newIncSeverity, setNewIncSeverity] = useState<Incident['severity']>('HIGH');
  const [newIncDesc, setNewIncDesc] = useState('');
  const [newIncAssignee, setNewIncAssignee] = useState('Rohan Verma (AV Lead)');
  const [newIncDeadline, setNewIncDeadline] = useState('18:00');

  // Stats
  const lateVendors = useMemo(() => arrivals.filter(a => a.isLate && a.status === 'LATE'), [arrivals]);
  const openIncidents = useMemo(() => incidents.filter(i => i.status !== 'RESOLVED'), [incidents]);
  const pendingAcksCount = useMemo(() => {
    return delays.reduce((acc, d) => {
      const pending = d.affectedVendors.filter(v => v.status === 'SENT').length;
      return acc + pending;
    }, 0);
  }, [delays]);

  // Selected Activity for Proposed Change
  const targetActivity = useMemo(() => {
    return runSheet.find(r => r.id === selectedActivityId);
  }, [runSheet, selectedActivityId]);

  // Handler: Propose Schedule Change
  const handleProposeScheduleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetActivity || !onProposeScheduleChange) return;

    // Calculate revised times
    const [origH, origM] = targetActivity.plannedStartTime.split(':').map(Number);
    const totalOrigMins = origH * 60 + origM;
    const totalRevMins = totalOrigMins + delayMinutes;
    const revH = String(Math.floor(totalRevMins / 60) % 24).padStart(2, '0');
    const revM = String(totalRevMins % 60).padStart(2, '0');
    const revisedStartTime = `${revH}:${revM}`;

    // Generate targeted vendor directives based on activity
    const affected: AffectedVendorInstruction[] = [
      {
        vendorId: 'v-caterer',
        vendorName: 'SpiceHeaven Royal Caterers',
        category: 'Catering',
        phone: '+91 98290 55443',
        instruction: `Extend holding cocktail pass by +${delayMinutes} mins. Delay main banquet line opening to ${revisedStartTime}.`,
        status: 'SENT',
        notifiedAt: currentTimeStr.slice(0, 5)
      },
      {
        vendorId: 'v-dj',
        vendorName: 'DJ Shadow & Sound Rig',
        category: 'DJ & Sound',
        phone: '+91 98200 99881',
        instruction: `Extend ambient Sufi background music. Hold royal bridal procession walk-in track until ${revisedStartTime} cue.`,
        status: 'SENT',
        notifiedAt: currentTimeStr.slice(0, 5)
      },
      {
        vendorId: 'v-photo',
        vendorName: 'Stories by Joseph Radhik',
        category: 'Cinematography',
        phone: '+91 98199 00112',
        instruction: `Reposition drone gimbal operators for revised twilight lighting sequence at ${revisedStartTime}.`,
        status: 'SENT',
        notifiedAt: currentTimeStr.slice(0, 5)
      },
      {
        vendorId: 'v-family',
        vendorName: 'Groom VIP Family Protocol Lead',
        category: 'Family Coordination',
        phone: '+91 98290 77112',
        instruction: `Keep groom entourage relaxed in Zenana Royal Suite. Announce revised ${revisedStartTime} procession cue.`,
        status: 'SENT',
        notifiedAt: currentTimeStr.slice(0, 5)
      }
    ];

    await onProposeScheduleChange({
      weddingId: targetActivity.weddingId,
      activityId: targetActivity.id,
      activityName: targetActivity.activityName,
      originalPlannedTime: targetActivity.plannedStartTime,
      revisedTime: revisedStartTime,
      delayMinutes,
      reason: delayReason,
      approvedByPlanner: requesterName,
      requester: requesterName,
      impactAssessment: `Cascades downstream activities by +${delayMinutes} mins. Banquet and reception dessert lines adjusted.`,
      affectedVendors: affected
    });

    setIsScheduleChangeModalOpen(false);
    setActiveSubTab('delays');
  };

  // Handler: Create Incident Submit
  const handleCreateIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncTitle || !onCreateIncident) return;

    await onCreateIncident({
      weddingId: 'wed-001',
      title: newIncTitle,
      category: newIncCategory,
      severity: newIncSeverity,
      description: newIncDesc,
      assignedTo: newIncAssignee,
      status: 'OPEN',
      deadline: newIncDeadline
    });

    setIsIncidentModalOpen(false);
    setNewIncTitle('');
    setNewIncDesc('');
  };

  // Handler: Resolve Incident Submit
  const handleResolveIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentForResolve) return;
    onResolveIncident(selectedIncidentForResolve.id, incidentResolutionNote);
    setIsResolveModalOpen(false);
    setSelectedIncidentForResolve(null);
  };

  // Handler: Report Problem Submit
  const handleReportProblemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onReportDelayProblem && problemDelayId && problemVendorId) {
      onReportDelayProblem(problemDelayId, problemVendorId, problemNoteInput);
    }
    setIsProblemModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Cockpit Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Live Wedding-Day Command Centre
            </h2>
            <span className="text-[11px] font-mono bg-slate-900 text-[#DFCA9B] font-bold px-2 py-0.5 rounded-md ml-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#DFCA9B]" /> {currentTimeStr} IST
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time execution cockpit for Udaipur Lake Palace ceremonies. Minute-by-minute cues, arrival checks, closed-loop schedule changes, and live incident tickets.
          </p>
        </div>

        {/* Operational Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          {lateVendors.length > 0 && (
            <button
              onClick={() => setActiveSubTab('arrivals')}
              className="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs hover:bg-rose-100 transition-colors flex items-center gap-1.5 animate-pulse"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{lateVendors.length} Late Vendor Alert</span>
            </button>
          )}

          {openIncidents.length > 0 && (
            <button
              onClick={() => setActiveSubTab('incidents')}
              className="bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs hover:bg-amber-100 transition-colors flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4 text-amber-600" />
              <span>{openIncidents.length} Active Incidents</span>
            </button>
          )}

          {pendingAcksCount > 0 && (
            <button
              onClick={() => setActiveSubTab('delays')}
              className="bg-blue-50 border border-blue-300 text-blue-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4 text-blue-600" />
              <span>{pendingAcksCount} Pending Vendor Ack</span>
            </button>
          )}

          <Button
            variant="gold"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => setIsScheduleChangeModalOpen(true)}
          >
            Propose Schedule Change
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'timeline'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Live Timeline & Run Sheet ({runSheet.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('arrivals')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'arrivals'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4 text-[#C5A059]" />
          <span>Vendor Arrival Board ({arrivals.length})</span>
          {lateVendors.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('delays')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'delays'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-500" />
          <span>Schedule Change Engine & Acks ({delays.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('incidents')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'incidents'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-500" />
          <span>Live Incidents ({openIncidents.length} Open)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'history'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4 text-slate-500" />
          <span>Change History & Audit Trail</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* SECTION A: LIVE TIMELINE & RUN SHEET */}
      {/* ============================================================ */}
      {activeSubTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C5A059]" />
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                  Day 2 Ceremony Timeline & Minute-by-Minute Run Sheet
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tracks Groom Arrival (Baraat flotilla), Garland Exchange (Varmala), Vedic Pheras, and Royal Banquet Dinner with live actual timings.
              </p>
            </div>
            <StatusBadge label="Day 2: Varmala & Pheras Live" variant="warning" size="sm" />
          </div>

          <div className="space-y-3">
            {runSheet.map((item, idx) => {
              const isDelayed = item.status === 'DELAYED';
              const isCompleted = item.status === 'COMPLETED';
              const isInProgress = item.status === 'IN_PROGRESS';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDelayed
                      ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/40'
                      : isInProgress
                      ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-300/40'
                      : isCompleted
                      ? 'bg-slate-50 border-slate-200 opacity-80'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#1B3B6F]/10 text-[#1B3B6F] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                            {item.functionName}
                          </span>
                          <StatusBadge
                            label={item.status}
                            variant={isDelayed ? 'warning' : isInProgress ? 'info' : isCompleted ? 'success' : 'neutral'}
                            pulsing={isDelayed || isInProgress}
                            size="sm"
                          />
                        </div>

                        <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">
                          {item.activityName}
                        </h4>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-1 font-mono font-medium text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Planned: {item.plannedStartTime} – {item.plannedEndTime}</span>
                          </div>

                          {(item.actualStartTime || item.actualEndTime) && (
                            <div className="flex items-center gap-1 font-mono font-bold text-emerald-800">
                              <span>Actual: {item.actualStartTime || '--:--'} – {item.actualEndTime || 'Active'}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.location}</span>
                          </div>

                          <div className="flex items-center gap-1 font-medium text-[#1B3B6F]">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Lead: {item.responsiblePerson}</span>
                          </div>
                        </div>

                        {/* Associated Vendors */}
                        {item.vendorNames.length > 0 && (
                          <div className="pt-2 flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="text-slate-400 text-[11px] font-semibold">Associated Vendors:</span>
                            {item.vendorNames.map((name, i) => (
                              <span
                                key={i}
                                className="bg-white border border-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px]"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational Quick Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!isCompleted && !isInProgress && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Play className="w-3 h-3" />}
                          onClick={() => {
                            if (onUpdateRunSheetItem) {
                              onUpdateRunSheetItem(item.id, {
                                status: 'IN_PROGRESS',
                                actualStartTime: currentTimeStr.slice(0, 5)
                              });
                            }
                          }}
                        >
                          Start Event
                        </Button>
                      )}

                      {isInProgress && (
                        <Button
                          variant="gold"
                          size="sm"
                          leftIcon={<CheckCircle className="w-3 h-3" />}
                          onClick={() => {
                            if (onUpdateRunSheetItem) {
                              onUpdateRunSheetItem(item.id, {
                                status: 'COMPLETED',
                                actualEndTime: currentTimeStr.slice(0, 5)
                              });
                            }
                          }}
                        >
                          Mark Complete
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<RotateCcw className="w-3 h-3 text-[#C5A059]" />}
                        onClick={() => {
                          setSelectedActivityId(item.id);
                          setIsScheduleChangeModalOpen(true);
                        }}
                      >
                        Propose Time Shift
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION B: VENDOR ARRIVAL BOARD */}
      {/* ============================================================ */}
      {activeSubTab === 'arrivals' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#C5A059]" />
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                  On-Site Vendor Arrival Cockpit
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Field coordinators verify logistics crew arrivals at island jetties. Late vendors trigger immediate warnings with automated coordinator dispatch.
              </p>
            </div>
            {lateVendors.length > 0 && (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg animate-pulse">
                {lateVendors.length} Late Arrivals Flagged
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {arrivals.map(arr => {
              const isLate = arr.status === 'LATE' || arr.isLate;
              const isCheckedIn = arr.status === 'CHECKED_IN';

              return (
                <div
                  key={arr.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isLate
                      ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-400/40 shadow-xs'
                      : isCheckedIn
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#0D1B2A]">{arr.vendorName}</h4>
                        <span className="text-[11px] font-bold text-[#C5A059] uppercase tracking-wider block">
                          {arr.category}
                        </span>
                      </div>
                      <StatusBadge
                        label={isLate ? 'LATE ARRIVAL' : isCheckedIn ? 'CHECKED IN' : 'EXPECTED'}
                        variant={isLate ? 'danger' : isCheckedIn ? 'success' : 'warning'}
                        pulsing={isLate}
                        size="sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Expected Arrival:</span>
                        <span className="font-mono font-bold text-slate-800">{arr.expectedArrivalTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Actual Arrival:</span>
                        <span className={`font-mono font-bold ${isLate ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {arr.actualArrivalTime || 'Not Checked In'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <span>Assigned Coordinator: </span>
                        <strong className="text-slate-800">{arr.assignedCoordinator}</strong>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                        <Phone className="w-3 h-3 text-[#C5A059]" />
                        <span>POC: {arr.contactPerson} ({arr.phone})</span>
                      </div>
                      {arr.notes && (
                        <p className={`text-[11px] italic p-1.5 rounded ${isLate ? 'bg-rose-100/70 text-rose-900 font-medium' : 'bg-slate-100 text-slate-600'}`}>
                          "{arr.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">Ref: {arr.id}</span>

                    {!isCheckedIn ? (
                      <Button
                        variant="gold"
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => onCheckinVendor(arr.id)}
                      >
                        Check-In Vendor
                      </Button>
                    ) : (
                      <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified On-Site
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION C: INCIDENT MANAGEMENT */}
      {/* ============================================================ */}
      {activeSubTab === 'incidents' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-600" />
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                  Event-Day Incident Management & Rapid Dispatch
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Support for late DJ, generator shortage, bridal car traffic delays, and emergency operational problems.
              </p>
            </div>

            <Button
              variant="gold"
              size="sm"
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              onClick={() => setIsIncidentModalOpen(true)}
            >
              Report New Incident
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {incidents.map(inc => {
              const isResolved = inc.status === 'RESOLVED';

              return (
                <div
                  key={inc.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isResolved
                      ? 'bg-slate-50 border-slate-200 opacity-80'
                      : inc.severity === 'HIGH' || inc.severity === 'CRITICAL'
                      ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-300 shadow-xs'
                      : 'bg-amber-50/30 border-amber-300 ring-1 ring-amber-300 shadow-xs'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <StatusBadge
                        label={inc.severity}
                        variant={inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? 'danger' : 'warning'}
                        size="sm"
                      />
                      <StatusBadge
                        label={inc.status}
                        variant={isResolved ? 'success' : 'danger'}
                        size="sm"
                      />
                    </div>

                    <h4 className="font-bold text-sm text-[#0D1B2A]">{inc.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{inc.description}</p>

                    <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Category:</span>
                        <strong className="text-slate-800">{inc.category}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Assigned Person:</span>
                        <strong className="text-[#1B3B6F]">{inc.assignedTo}</strong>
                      </div>
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Reported Time:</span>
                        <span>{inc.reportedAt}</span>
                      </div>
                      {inc.deadline && (
                        <div className="flex justify-between font-mono text-[11px] text-amber-800 font-bold">
                          <span>SLA Deadline:</span>
                          <span>{inc.deadline}</span>
                        </div>
                      )}
                    </div>

                    {isResolved && inc.resolutionNote && (
                      <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-0.5">
                        <span className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolution Confirmed:
                        </span>
                        <p className="text-[11px]">{inc.resolutionNote}</p>
                        <span className="text-[10px] text-emerald-700 block font-mono">Resolved: {inc.resolvedAt}</span>
                      </div>
                    )}
                  </div>

                  {!isResolved && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3 w-full"
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setSelectedIncidentForResolve(inc);
                        setIsResolveModalOpen(true);
                      }}
                    >
                      Resolve Incident
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION D & E: CLOSED-LOOP DELAY ENGINE & ACK TRACKING */}
      {/* ============================================================ */}
      {activeSubTab === 'delays' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                  Closed-Loop Schedule Change Engine & Real-Time Acknowledgment Board
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Strict Rule Enforced: When a ceremony slips, the system dispatches targeted directives. <strong className="text-amber-800">Sent</strong> notifications NEVER automatically count as acknowledged until verified with an audit timestamp.
              </p>
            </div>

            <Button
              variant="gold"
              size="sm"
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              onClick={() => setIsScheduleChangeModalOpen(true)}
            >
              Propose New Change
            </Button>
          </div>

          <div className="space-y-6">
            {delays.map(delay => {
              const totalVendors = delay.affectedVendors.length;
              const acknowledgedCount = delay.affectedVendors.filter(v => v.status === 'ACKNOWLEDGED').length;
              const problemCount = delay.affectedVendors.filter(v => v.status === 'PROBLEM').length;
              const isApproved = delay.state === 'APPROVED' || delay.state === 'PUBLISHED';
              const isPublished = delay.state === 'PUBLISHED';

              return (
                <div
                  key={delay.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 space-y-4 shadow-2xs"
                >
                  {/* Change Header Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200/80 rounded-xl p-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700" />
                        <span className="font-serif font-bold text-sm text-[#0D1B2A]">
                          {delay.activityName}: Time Shift (+{delay.delayMinutes} Mins)
                        </span>
                        <StatusBadge
                          label={delay.state}
                          variant={delay.state === 'PUBLISHED' ? 'success' : delay.state === 'APPROVED' ? 'info' : 'warning'}
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-slate-600 pl-6">
                        <span className="font-semibold">Reason:</span> {delay.reason} | <span className="font-semibold">Requester:</span> {delay.requester}
                        {delay.approver && <span> | <span className="font-semibold">Approved by:</span> {delay.approver}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold">
                        <span className="text-slate-400 line-through">{delay.originalPlannedTime}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md">
                          Revised: {delay.revisedTime}
                        </span>
                      </div>

                      {/* State Workflow Buttons */}
                      {delay.state === 'PROPOSED' && onApproveScheduleChange && (
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => onApproveScheduleChange(delay.id, 'Priya Mehra (Director)')}
                        >
                          Approve Change
                        </Button>
                      )}

                      {delay.state === 'APPROVED' && onPublishScheduleChange && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Send className="w-3 h-3" />}
                          onClick={() => onPublishScheduleChange(delay.id)}
                        >
                          Publish & Broadcast
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Impact Assessment */}
                  {delay.impactAssessment && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                      <div>
                        <strong>Impact Assessment & Cascades:</strong> {delay.impactAssessment}
                      </div>
                    </div>
                  )}

                  {/* SECTION E: ACKNOWLEDGEMENT TRACKING BOARD */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
                      <span>Targeted Vendor Directives & Real-Time Receipt</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-700">{acknowledgedCount} Acknowledged</span>
                        {problemCount > 0 && <span className="text-rose-700">{problemCount} Problem Reported</span>}
                        <span className="text-amber-700">{totalVendors - acknowledgedCount - problemCount} Waiting</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {delay.affectedVendors.map(vendor => {
                        const isAck = vendor.status === 'ACKNOWLEDGED';
                        const isProblem = vendor.status === 'PROBLEM';
                        const isWaiting = vendor.status === 'SENT';

                        return (
                          <div
                            key={vendor.vendorId}
                            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                              isAck
                                ? 'bg-emerald-50/40 border-emerald-300'
                                : isProblem
                                ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400'
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
                                  label={vendor.status}
                                  variant={isAck ? 'success' : isProblem ? 'danger' : 'warning'}
                                  size="sm"
                                />
                              </div>

                              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-xs text-slate-700">
                                <span className="font-semibold text-slate-800 block text-[10px] uppercase tracking-wider mb-0.5">
                                  Specific Operational Directive:
                                </span>
                                "{vendor.instruction}"
                              </div>

                              {isAck && (
                                <div className="text-[11px] text-emerald-800 bg-emerald-100/60 p-2 rounded-md border border-emerald-200 flex items-start gap-1.5 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{vendor.responseNote || 'Confirmed & adjusted deployment.'} ({vendor.acknowledgedAt})</span>
                                </div>
                              )}

                              {isProblem && (
                                <div className="text-[11px] text-rose-800 bg-rose-100/80 p-2 rounded-md border border-rose-200 flex items-start gap-1.5 font-bold">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                  <span>{vendor.responseNote} ({vendor.acknowledgedAt})</span>
                                </div>
                              )}
                            </div>

                            {/* Individual Vendor Ack & Conflict Triggers */}
                            {isWaiting && (
                              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Dispatched at {vendor.notifiedAt}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setProblemDelayId(delay.id);
                                      setProblemVendorId(vendor.vendorId);
                                      setProblemVendorName(vendor.vendorName);
                                      setIsProblemModalOpen(true);
                                    }}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-rose-200 transition-colors"
                                  >
                                    Report Conflict
                                  </button>
                                  <button
                                    onClick={() => onAcknowledgeInstruction(delay.id, vendor.vendorId, 'Confirmed & adjusted deployment.')}
                                    className="bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>Record Ack</span>
                                  </button>
                                </div>
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
      )}

      {/* ============================================================ */}
      {/* SECTION F: CHANGE HISTORY & AUDIT TRAIL */}
      {/* ============================================================ */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#C5A059]" />
              <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                Schedule Change History & Legal Audit Trail
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable operational log of previous schedules, revised timings, requesters, approvers, and vendor confirmations.
            </p>
          </div>

          <div className="space-y-3">
            {delays.map(delay => (
              <div
                key={delay.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-500">{delay.id}</span>
                    <span className="font-serif font-bold text-sm text-[#0D1B2A]">{delay.activityName}</span>
                    <StatusBadge label={delay.state} variant="success" size="sm" />
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">{delay.changeTimestamp}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Previous Schedule:</span>
                    <span className="font-mono font-bold text-slate-600 line-through">{delay.originalPlannedTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Updated Schedule:</span>
                    <span className="font-mono font-bold text-emerald-800">{delay.revisedTime} (+{delay.delayMinutes}m)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Requester:</span>
                    <span className="font-bold text-slate-800">{delay.requester}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Approver:</span>
                    <span className="font-bold text-[#1B3B6F]">{delay.approver || 'Client Representative'}</span>
                  </div>
                </div>

                <div className="pt-2 text-slate-600 text-[11px] border-t border-slate-200/60 flex items-center justify-between">
                  <span><strong>Reason:</strong> {delay.reason}</span>
                  <span><strong>Confirmed Vendors:</strong> {delay.affectedVendors.filter(v => v.status === 'ACKNOWLEDGED').length} of {delay.affectedVendors.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: PROPOSE SCHEDULE CHANGE WORKFLOW */}
      {/* ============================================================ */}
      <Modal
        isOpen={isScheduleChangeModalOpen}
        onClose={() => setIsScheduleChangeModalOpen(false)}
        title="Propose Schedule Change (Closed-Loop Engine)"
        subtitle="Calculate cascade impact, identify affected vendors, and queue for authorization"
        maxWidth="xl"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsScheduleChangeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleProposeScheduleChange}>
              Submit for Approval & Dispatch
            </Button>
          </>
        }
      >
        <form onSubmit={handleProposeScheduleChange} className="space-y-4">
          <FormField label="Select Activity to Shift" required>
            <Select
              value={selectedActivityId}
              onChange={e => setSelectedActivityId(e.target.value)}
              options={runSheet.map(r => ({
                value: r.id,
                label: `${r.functionName} — ${r.activityName} (${r.plannedStartTime})`
              }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Delay Minutes (Shift Duration)" required>
              <Select
                value={String(delayMinutes)}
                onChange={e => setDelayMinutes(Number(e.target.value))}
                options={[
                  { value: '15', label: '+15 Minutes' },
                  { value: '25', label: '+25 Minutes (Standard)' },
                  { value: '30', label: '+30 Minutes' },
                  { value: '45', label: '+45 Minutes' },
                  { value: '60', label: '+60 Minutes (Major Shift)' }
                ]}
              />
            </FormField>

            <FormField label="Requester / Lead Director" required>
              <Input
                value={requesterName}
                onChange={e => setRequesterName(e.target.value)}
                required
              />
            </FormField>
          </div>

          <FormField label="Operational Justification / Reason" required>
            <Input
              value={delayReason}
              onChange={e => setDelayReason(e.target.value)}
              placeholder="e.g. Bride procession vehicle held up in Sukhadia Circle traffic..."
              required
            />
          </FormField>

          {/* Automatic Cascade Preview */}
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>Automatic Vendor Directive Identification:</span>
            </div>
            <ul className="space-y-1 text-[11px] list-disc pl-4 text-amber-800">
              <li><strong>Caterer:</strong> Instructed to extend cocktail passed appetizers by +{delayMinutes}m.</li>
              <li><strong>DJ & Sound:</strong> Instructed to hold high-energy bridal entry music until revised cue.</li>
              <li><strong>Photography:</strong> Drone operators alerted for revised sunset light angles.</li>
              <li><strong>Family Protocol:</strong> Groom suite briefed to avoid last-minute confusion.</li>
            </ul>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 2: REPORT NEW INCIDENT */}
      {/* ============================================================ */}
      <Modal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        title="Log Live Operational Incident"
        subtitle="Record unexpected disruption and assign rapid on-ground lead"
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsIncidentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleCreateIncidentSubmit}>
              Log Incident Ticket
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateIncidentSubmit} className="space-y-3.5">
          <FormField label="Incident Title" required>
            <Input
              placeholder="e.g. Bride's car stuck at old city bridge traffic"
              value={newIncTitle}
              onChange={e => setNewIncTitle(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" required>
              <Select
                value={newIncCategory}
                onChange={e => setNewIncCategory(e.target.value as any)}
                options={[
                  { value: 'VENDOR_DELAY', label: 'Vendor Delay (DJ, Catering)' },
                  { value: 'EQUIPMENT', label: 'Equipment / Generator Shortage' },
                  { value: 'LOGISTICS', label: 'Logistics / Transport Delay' },
                  { value: 'GUEST_EMERGENCY', label: 'Guest Emergency / VIP Alert' }
                ]}
              />
            </FormField>

            <FormField label="Severity Level" required>
              <Select
                value={newIncSeverity}
                onChange={e => setNewIncSeverity(e.target.value as any)}
                options={[
                  { value: 'HIGH', label: 'High Severity' },
                  { value: 'CRITICAL', label: 'Critical Severity' },
                  { value: 'MEDIUM', label: 'Medium Severity' },
                  { value: 'LOW', label: 'Low Severity' }
                ]}
              />
            </FormField>
          </div>

          <FormField label="Detailed Description & Operational Impact" required>
            <Input
              placeholder="e.g. Narrow lane blockade near lake jetty. Need immediate escort."
              value={newIncDesc}
              onChange={e => setNewIncDesc(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Assigned Coordinator" required>
              <Select
                value={newIncAssignee}
                onChange={e => setNewIncAssignee(e.target.value)}
                options={[
                  { value: 'Rohan Verma (AV Lead)', label: 'Rohan Verma (AV Lead)' },
                  { value: 'Amit Sharma (Operations Lead)', label: 'Amit Sharma (Operations Lead)' },
                  { value: 'Siddharth Jain (Transport Lead)', label: 'Siddharth Jain (Transport Lead)' },
                  { value: 'Anita Roy (Hospitality Lead)', label: 'Anita Roy (Hospitality Lead)' },
                  { value: 'Priya Mehra (Principal Director)', label: 'Priya Mehra (Principal Director)' }
                ]}
              />
            </FormField>

            <FormField label="Resolution SLA Deadline">
              <Input
                placeholder="18:30"
                value={newIncDeadline}
                onChange={e => setNewIncDeadline(e.target.value)}
              />
            </FormField>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 3: RESOLVE INCIDENT */}
      {/* ============================================================ */}
      {selectedIncidentForResolve && (
        <Modal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          title={`Resolve Incident: ${selectedIncidentForResolve.title}`}
          subtitle="Record on-ground resolution details before closing ticket"
          maxWidth="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsResolveModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" size="sm" onClick={handleResolveIncidentSubmit}>
                Confirm Resolution
              </Button>
            </>
          }
        >
          <form onSubmit={handleResolveIncidentSubmit} className="space-y-3.5">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
              <strong>Incident Description:</strong> {selectedIncidentForResolve.description}
            </div>

            <FormField label="Resolution Details & Verification Note" required>
              <Input
                value={incidentResolutionNote}
                onChange={e => setIncidentResolutionNote(e.target.value)}
                placeholder="e.g. Secondary generator connected; power restored at 15:15."
                required
              />
            </FormField>
          </form>
        </Modal>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: REPORT VENDOR CONFLICT / PROBLEM */}
      {/* ============================================================ */}
      <Modal
        isOpen={isProblemModalOpen}
        onClose={() => setIsProblemModalOpen(false)}
        title={`Report Vendor Conflict: ${problemVendorName}`}
        subtitle="Log vendor inability to comply with revised schedule directive"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsProblemModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleReportProblemSubmit}>
              Log Problem State
            </Button>
          </>
        }
      >
        <form onSubmit={handleReportProblemSubmit} className="space-y-3.5">
          <FormField label="Vendor Conflict Explanation" required>
            <Input
              value={problemNoteInput}
              onChange={e => setProblemNoteInput(e.target.value)}
              placeholder="e.g. Caterer warns food holding maximum is 30 mins before quality degrades."
              required
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
