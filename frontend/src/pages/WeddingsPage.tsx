/**
 * =============================================================================
 * File: WeddingsPage.tsx
 * Module: Agency Operations Page
 * =============================================================================
 * Delivers full-scale wedding planning and coordination workspace for WeddingsPage, supporting real-time data inspection, filtering, and reporting.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Wedding, WeddingFunction, WeddingTask } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { api } from '../services/api';
import {
  Crown,
  Sparkles,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  CheckSquare,
  Layers,
  Briefcase,
  FileSpreadsheet,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface WeddingsPageProps {
  weddings: Wedding[];
  currentWedding: Wedding;
  onSelectWedding: (wedding: Wedding) => void;
  onNavigateToTab: (tab: any) => void;
}

/**
 * WeddingsPage component
 *
 * Portfolio list of destination palace weddings with lifecycle filters.
 */
export const WeddingsPage: React.FC<WeddingsPageProps> = ({
  weddings,
  currentWedding,
  onSelectWedding,
  onNavigateToTab
}) => {
  const [functions, setFunctions] = useState<WeddingFunction[]>([]);
  const [tasks, setTasks] = useState<WeddingTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load functions and tasks for the active wedding
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.getWeddingFunctions(currentWedding.id),
      api.getTasks(currentWedding.id)
    ]).then(([funcs, taskList]) => {
      setFunctions(funcs);
      setTasks(taskList);
      setIsLoading(false);
    });
  }, [currentWedding.id]);

  // Filter tasks matching current wedding package
  const activeTasks = tasks.filter(t => {
    if (currentWedding.packageType === 'day_of' && t.packageScope === 'FULL_SERVICE_ONLY') {
      return false;
    }
    return true;
  });

  const totalTasks = activeTasks.length;
  const doneTasks = activeTasks.filter(t => t.stage === 'DONE').length;
  const inProgressTasks = activeTasks.filter(t => t.stage === 'IN_PROGRESS').length;
  const blockedTasks = activeTasks.filter(t => t.stage === 'BLOCKED').length;
  const toPlanTasks = activeTasks.filter(t => t.stage === 'TO_PLAN').length;

  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Core Luxury Planning Team Roster
  const coreTeam = [
    { name: currentWedding.assignedPlanner, role: 'Principal Luxury Director', phone: '+91 98290 11223', email: 'priya@theroyalknot.com' },
    { name: 'Devendra Kaviraj', role: 'Senior Heritage Production Lead', phone: '+91 98290 44556', email: 'devendra@theroyalknot.com' },
    { name: 'Siddharth Jain', role: 'Vendor Operations & Flotilla Head', phone: '+91 94140 77889', email: 'siddharth@theroyalknot.com' },
    { name: 'Anita Roy', role: 'Hospitality & Guest Concierge', phone: '+91 98291 33445', email: 'anita@theroyalknot.com' },
    { name: 'Amit Sharma', role: 'Technical & Mandap Safety Officer', phone: '+91 98292 66778', email: 'amit@theroyalknot.com' }
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header & Wedding Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Central Wedding Planning Workspace
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 1.3: Dedicated operations workspace for {currentWedding.coupleNames}. Differentiates Full-Service (complete theme, venue, 18-vendor procurement, 3D layouts, rehearsals) vs Partial / Day-Of Coordination.
          </p>
        </div>

        {/* Wedding Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Active Wedding:</span>
          <div className="relative">
            <select
              value={currentWedding.id}
              onChange={(e) => {
                const target = weddings.find(w => w.id === e.target.value);
                if (target) onSelectWedding(target);
              }}
              className="bg-[#F5F1E8] border border-[#C5A059]/40 text-[#0D1B2A] text-xs font-bold py-2 pl-3 pr-8 rounded-xl appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#C5A059] cursor-pointer shadow-2xs"
            >
              {weddings.map(w => (
                <option key={w.id} value={w.id}>
                  {w.code} — {w.coupleNames}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#0D1B2A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Hero Workspace Overview Banner */}
      <div className="bg-gradient-to-br from-[#0D1B2A] via-[#1B3B6F] to-[#0D1B2A] text-white rounded-2xl p-6 shadow-md space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#DFCA9B] bg-white/10 px-2.5 py-0.5 rounded-md">
                {currentWedding.code}
              </span>
              <StatusBadge label={currentWedding.status} variant="warning" size="sm" />
              <StatusBadge
                label={currentWedding.packageType === 'full_service' ? 'Full-Service Luxury Package' : 'Partial / Day-Of Package'}
                variant="info"
                size="sm"
              />
              <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Agreement Executed
              </span>
            </div>

            <h3 className="font-serif font-bold text-2xl sm:text-3xl tracking-wide">
              {currentWedding.coupleNames}
            </h3>
            <p className="text-xs sm:text-sm text-[#DFCA9B] font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {currentWedding.theme}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">
              Sanctioned Maximum Budget
            </span>
            <CurrencyDisplay
              amount={currentWedding.budgetMax}
              format="crores"
              showDecimals
              className="text-2xl sm:text-3xl font-serif text-[#DFCA9B]"
            />
            <span className="text-[10px] text-slate-300 block mt-0.5">
              Deposit Paid: ₹{(currentWedding.depositAmount / 100000).toFixed(0)} Lakhs
            </span>
          </div>
        </div>

        {/* 4 Primary Operational Metadata Cells */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">3-Day Wedding Dates:</span>
            <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-[#DFCA9B]" />
              {currentWedding.weddingDate} → {currentWedding.endDate}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Destination Location:</span>
            <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#DFCA9B]" />
              {currentWedding.location.split(',')[0]}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Guest Count (Confirmed):</span>
            <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
              <Users className="w-3.5 h-3.5 text-[#DFCA9B]" />
              {currentWedding.guestCount} High-Net-Worth Guests
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Lead Luxury Director:</span>
            <span className="font-semibold text-[#DFCA9B] flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3.5 h-3.5" />
              {currentWedding.assignedPlanner}
            </span>
          </div>
        </div>

        {/* Quick Action Dock */}
        <div className="pt-2 flex flex-wrap gap-2.5">
          <Button
            variant="gold"
            size="sm"
            leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
            onClick={() => onNavigateToTab('tasks')}
          >
            Planning Tasks ({totalTasks} Tasks)
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            onClick={() => onNavigateToTab('quotations')}
          >
            3-Caterer RFQ Quotes
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Layers className="w-3.5 h-3.5" />}
            onClick={() => onNavigateToTab('command-centre')}
          >
            Live Command Centre
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Briefcase className="w-3.5 h-3.5" />}
            onClick={() => onNavigateToTab('finance')}
          >
            Reconciliation & Settlements
          </Button>
        </div>
      </div>

      {/* Planning Progress Engine */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#C5A059]" />
              <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                Planning Progress & Task Health ({progressPercent}% Completed)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {doneTasks} of {totalTasks} milestone tasks successfully verified and executed for {currentWedding.packageType.replace('_', ' ')}.
            </p>
          </div>

          <span className="text-lg font-serif font-bold text-[#1B3B6F]">
            {progressPercent}% Done
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` }}
            title={`Completed: ${doneTasks}`}
          />
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
            title={`In Progress: ${inProgressTasks}`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${totalTasks > 0 ? (blockedTasks / totalTasks) * 100 : 0}%` }}
            title={`Blocked: ${blockedTasks}`}
          />
          <div
            className="bg-slate-300 h-full transition-all duration-300"
            style={{ width: `${totalTasks > 0 ? (toPlanTasks / totalTasks) * 100 : 0}%` }}
            title={`To Plan: ${toPlanTasks}`}
          />
        </div>

        {/* 4 Task Stage Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">To Plan</span>
              <span className="text-lg font-bold text-slate-700">{toPlanTasks}</span>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-blue-800 uppercase font-bold block">In Progress</span>
              <span className="text-lg font-bold text-blue-900">{inProgressTasks}</span>
            </div>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">Done</span>
              <span className="text-lg font-bold text-emerald-900">{doneTasks}</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-rose-800 uppercase font-bold block">Blocked</span>
              <span className="text-lg font-bold text-rose-900">{blockedTasks}</span>
            </div>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
        </div>
      </div>

      {/* Wedding Functions (Mehendi, Sangeet, Pheras, Reception) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C5A059]" />
              <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                Sub-Functions & Event Execution Stages
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specific multi-day functions with designated venue zones, guest capacities, and lead coordinators.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {functions.map(fn => {
            const isCompleted = fn.status === 'COMPLETED';
            const isActive = fn.status === 'IN_PROGRESS';

            return (
              <div
                key={fn.id}
                className={`p-4 rounded-xl border transition-all space-y-2 flex flex-col justify-between ${
                  isActive
                    ? 'border-[#C5A059] bg-[#F5F1E8]/50 ring-2 ring-[#C5A059]/30 shadow-xs'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50/60'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="uppercase tracking-wider text-[#C5A059]">{fn.name}</span>
                    <StatusBadge
                      label={fn.status}
                      variant={isCompleted ? 'success' : isActive ? 'warning' : 'info'}
                      size="sm"
                    />
                  </div>

                  <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">
                    {fn.title}
                  </h4>

                  <div className="space-y-1 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{fn.date} • {fn.startTime} to {fn.endTime}</span>
                    </div>

                    <div className="flex items-start gap-1 text-[11px] text-slate-600">
                      <MapPin className="w-3 h-3 text-[#C5A059] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{fn.venueArea}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>{fn.guestCapacity} Guests</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 text-[10px] font-mono">Lead: {fn.assignedLead.split(' ')[0]}</span>
                  <button
                    onClick={() => onNavigateToTab('tasks')}
                    className="text-[#1B3B6F] hover:text-[#0D1B2A] font-semibold text-[11px] flex items-center gap-0.5"
                  >
                    View Tasks <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core Luxury Team Roster */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C5A059]" />
              <h3 className="font-serif font-bold text-base text-[#0D1B2A]">
                Assigned Core Luxury Operations Team
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dedicated on-ground personnel managing client expectations, vendor coordination, and 3-day palace logistics.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">5 Key Leads</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {coreTeam.map((member, idx) => (
            <div
              key={idx}
              className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs"
            >
              <div className="font-serif font-bold text-sm text-[#0D1B2A]">{member.name}</div>
              <div className="text-[11px] font-medium text-[#C5A059]">{member.role}</div>
              <div className="text-[10px] font-mono text-slate-500">{member.phone}</div>
              <div className="text-[10px] text-slate-400 truncate">{member.email}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
