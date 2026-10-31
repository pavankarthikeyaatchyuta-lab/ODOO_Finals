import React from 'react';
import { Sliders, Crown, Shield, User, Sparkles, Building, Database } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Agency Configuration & Role Permissions
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System parameters, destination hubs (Jaipur & Udaipur), and role-based access controls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );
};
