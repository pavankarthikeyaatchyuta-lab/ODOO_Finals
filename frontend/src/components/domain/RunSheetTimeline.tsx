import React from 'react';
import { RunSheetItem, VendorArrival } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Clock, MapPin, User, AlertTriangle, CheckCircle, Radio, Phone } from 'lucide-react';

interface RunSheetTimelineProps {
  items: RunSheetItem[];
  arrivals: VendorArrival[];
  onCheckinVendor: (arrivalId: string) => void;
}

export const RunSheetTimeline: React.FC<RunSheetTimelineProps> = ({
  items,
  arrivals,
  onCheckinVendor
}) => {
  return (
    <div className="space-y-6">
      {/* Top Split: Live Execution Run Sheet + Vendor Arrival Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Minute-by-Minute Run Sheet */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                  Live Wedding-Day Schedule (Minute-by-Minute)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time operational cues, responsible coordinators, and linked vendor dependencies.
              </p>
            </div>
            <StatusBadge label="Day 2: Varmala & Pheras" variant="info" size="sm" />
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => {
              const isDelayed = item.status === 'DELAYED';
              const isCompleted = item.status === 'COMPLETED';
              const isUpcoming = item.status === 'UPCOMING';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDelayed
                      ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/40'
                      : isCompleted
                      ? 'bg-slate-50 border-slate-200/80 opacity-80'
                      : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#1B3B6F]/10 text-[#1B3B6F] text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {item.functionName}
                      </span>
                    </div>

                    <StatusBadge
                      label={item.status}
                      variant={isDelayed ? 'warning' : isCompleted ? 'neutral' : 'info'}
                      pulsing={isDelayed}
                      size="sm"
                    />
                  </div>

                  <div className="mt-2 pl-8">
                    <h4 className="font-semibold text-sm text-[#0D1B2A] flex items-center gap-2">
                      {item.activityName}
                    </h4>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-mono font-medium text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                        {item.plannedStartTime} – {item.plannedEndTime}
                        {item.actualStartTime && (
                          <span className={`ml-1.5 font-bold ${isDelayed ? 'text-amber-800' : 'text-emerald-700'}`}>
                            (Actual: {item.actualStartTime})
                          </span>
                        )}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.location}
                      </span>

                      <span className="flex items-center gap-1 font-medium text-[#1B3B6F]">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {item.responsiblePerson}
                      </span>
                    </div>

                    {/* Linked Vendors */}
                    {item.vendorNames.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">Assigned Vendors:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.vendorNames.map((name, i) => (
                            <span
                              key={i}
                              className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md text-[11px]"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Live Vendor Arrival Cockpit & Late Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C5A059]" />
              Vendor Arrival Cockpit
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Field coordinators log arrival. Anyone running late is spotted immediately.
            </p>
          </div>

          <div className="space-y-3">
            {arrivals.map(arr => {
              const isLate = arr.status === 'LATE' || arr.isLate;
              const isCheckedIn = arr.status === 'CHECKED_IN';

              return (
                <div
                  key={arr.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isLate
                      ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400/40'
                      : isCheckedIn
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-[#0D1B2A]">{arr.vendorName}</h4>
                      <p className="text-[11px] text-slate-500">{arr.category}</p>
                    </div>
                    <StatusBadge
                      label={isLate ? 'LATE ALERT' : isCheckedIn ? 'CHECKED IN' : 'EXPECTED'}
                      variant={isLate ? 'danger' : isCheckedIn ? 'success' : 'neutral'}
                      pulsing={isLate}
                      size="sm"
                    />
                  </div>

                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Expected Arrival:</span>
                      <span className="font-mono font-semibold">{arr.expectedArrivalTime}</span>
                    </div>
                    {arr.actualArrivalTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Actual Checked-In:</span>
                        <span className="font-mono font-bold text-emerald-700">{arr.actualArrivalTime}</span>
                      </div>
                    )}
                    {arr.notes && (
                      <p className={`text-[11px] pt-1 ${isLate ? 'text-rose-700 font-semibold' : 'text-slate-500'}`}>
                        {arr.notes}
                      </p>
                    )}
                  </div>

                  {/* Checkin Action */}
                  {!isCheckedIn && (
                    <button
                      onClick={() => onCheckinVendor(arr.id)}
                      className="mt-3 w-full bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Confirm Vendor Arrival</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
