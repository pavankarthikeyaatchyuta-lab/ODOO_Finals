import React, { useState } from 'react';
import { RunSheetItem, VendorArrival, TimelineDelay, Incident } from '../types';
import { RunSheetTimeline } from '../components/domain/RunSheetTimeline';
import { DelayAckBoard } from '../components/domain/DelayAckBoard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Radio,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  PlusCircle,
  ShieldAlert,
  Flame
} from 'lucide-react';

interface CommandCentrePageProps {
  runSheet: RunSheetItem[];
  arrivals: VendorArrival[];
  delays: TimelineDelay[];
  incidents: Incident[];
  onCheckinVendor: (arrivalId: string) => void;
  onAcknowledgeInstruction: (delayId: string, vendorId: string) => void;
  onResolveIncident: (incidentId: string, note: string) => void;
}

export const CommandCentrePage: React.FC<CommandCentrePageProps> = ({
  runSheet,
  arrivals,
  delays,
  incidents,
  onCheckinVendor,
  onAcknowledgeInstruction,
  onResolveIncident
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'delays' | 'incidents'>('timeline');

  const lateVendorsCount = arrivals.filter(a => a.isLate && a.status === 'LATE').length;
  const openIncidentsCount = incidents.filter(i => i.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Top Cockpit Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Live Wedding-Day Command Centre
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scenario 4 + Key Differentiator: Live minute-by-minute schedule, vendor arrival check-in with late alerts, closed-loop delay notifications, and rapid incident tickets.
          </p>
        </div>

        {/* Operational Status Badges */}
        <div className="flex items-center gap-2">
          {lateVendorsCount > 0 && (
            <StatusBadge
              label={`${lateVendorsCount} LATE VENDOR ALERT`}
              variant="danger"
              pulsing={true}
              size="sm"
            />
          )}
          {openIncidentsCount > 0 && (
            <StatusBadge
              label={`${openIncidentsCount} ACTIVE INCIDENTS`}
              variant="warning"
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'timeline'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Live Run Sheet & Vendor Check-In</span>
        </button>

        <button
          onClick={() => setActiveSubTab('delays')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'delays'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Radio className="w-4 h-4 text-[#C5A059]" />
          <span>Closed-Loop Delay Coordination (Key Differentiator)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('incidents')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'incidents'
              ? 'bg-[#1B3B6F] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          <span>Live Incident Tickets ({openIncidentsCount} Open)</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeSubTab === 'timeline' && (
        <RunSheetTimeline
          items={runSheet}
          arrivals={arrivals}
          onCheckinVendor={onCheckinVendor}
        />
      )}

      {activeSubTab === 'delays' && (
        <DelayAckBoard
          delays={delays}
          onAcknowledgeInstruction={onAcknowledgeInstruction}
        />
      )}

      {activeSubTab === 'incidents' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                Event-Day Incident Response Log
              </h3>
              <p className="text-xs text-slate-500">
                Track unexpected operational disruptions: late arrivals, equipment generator shortages, and traffic delays.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {incidents.map(inc => {
              const isResolved = inc.status === 'RESOLVED';

              return (
                <div
                  key={inc.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isResolved
                      ? 'bg-slate-50 border-slate-200 opacity-80'
                      : 'bg-white border-rose-300 ring-1 ring-rose-300/40 shadow-xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <StatusBadge
                        label={inc.severity}
                        variant={inc.severity === 'HIGH' ? 'danger' : 'warning'}
                        size="sm"
                      />
                      <StatusBadge
                        label={inc.status}
                        variant={isResolved ? 'success' : 'danger'}
                        size="sm"
                      />
                    </div>

                    <h4 className="font-bold text-sm text-[#0D1B2A]">{inc.title}</h4>
                    <p className="text-xs text-slate-600">{inc.description}</p>

                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 space-y-1">
                      <div>Assigned: <span className="font-semibold text-slate-800">{inc.assignedTo}</span></div>
                      <div>Reported: <span className="font-mono">{inc.reportedAt}</span></div>
                      {inc.resolvedAt && (
                        <div className="text-emerald-700 font-semibold">
                          Resolved: {inc.resolvedAt} ({inc.resolutionNote})
                        </div>
                      )}
                    </div>
                  </div>

                  {!isResolved && (
                    <button
                      onClick={() => onResolveIncident(inc.id, 'Issue resolved & verified on-site.')}
                      className="mt-3 w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Incident Resolved</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
