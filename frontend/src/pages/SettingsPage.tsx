import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Building, Database, Activity, Server, CheckCircle2, Lock, Key } from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const isHealthy = await api.checkBackendHealth();
      setBackendStatus(isHealthy);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Agency Configuration & System Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System parameters, destination operations (Jaipur & Udaipur), role-based permissions, and API telemetry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operating Profile */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-[#C5A059]" />
            <h3 className="font-serif font-bold text-sm text-[#0D1B2A]">Agency Operating Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Agency Legal Entity:</label>
              <input
                disabled
                value="The Royal Knot Destination Weddings Pvt. Ltd."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Primary Operating Hubs:</label>
              <input
                disabled
                value="Jaipur (Rambagh & Fairmont) & Udaipur (Jagmandir & Zenana Mahal)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Standard Season Capacity:</label>
              <input
                disabled
                value="25 Luxury Weddings / Season (400+ Guests Each)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Role Enforcement */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-[#1B3B6F]" />
            <h3 className="font-serif font-bold text-sm text-[#0D1B2A]">Role-Based Access Enforcement</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block">Lead Luxury Planner (Priya Mehra)</span>
              <p className="text-slate-500 text-[11px]">Authorized: Agreement generation, vendor quote selection, run sheet management.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block">Field Coordinator (Siddharth / Amit)</span>
              <p className="text-slate-500 text-[11px]">Authorized: Vendor arrival check-in, incident creation, run sheet actual timestamps.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block">Finance & Settlement (Devendra Kaviraj)</span>
              <p className="text-slate-500 text-[11px]">Authorized: Advance netting, change order reconciliation, final vendor disbursement.</p>
            </div>
          </div>
        </div>
      </div>

      {/* API & Data Integrity Diagnostics Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#C5A059]" />
            <h3 className="font-serif font-bold text-sm text-[#0D1B2A]">
              API Telemetry & Architecture Diagnostics
            </h3>
          </div>

          <button
            onClick={checkHealth}
            disabled={checking}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span>{checking ? 'Pinging /api/v1/health...' : 'Re-check Connection'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Backend Protocol Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${backendStatus ? 'bg-emerald-500 animate-pulse' : 'bg-[#C5A059]'}`}></span>
              <span className="font-bold text-slate-800">
                {backendStatus ? 'Live Node/Express Endpoint' : 'Enterprise Standalone Mode'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Base: {api.getApiBase()}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Idempotency & Guardrails</span>
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Idempotency-Key Enforced</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Prevents duplicate task creation, duplicate RFQ submissions & duplicate payouts.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Security & RLS Gating</span>
            <div className="flex items-center gap-1.5 text-[#1B3B6F] font-bold mt-1">
              <Lock className="w-3.5 h-3.5 text-[#1B3B6F]" />
              <span>Digital Agreement Gated</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Vendor directory & downloads locked until client contract is verified and signed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
