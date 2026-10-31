/**
 * =============================================================================
 * File: UnauthorizedPage.tsx
 * Module: Authentication & Identity Page
 * =============================================================================
 * Provides user interface, credential validation, and role-based redirect flows for the UnauthorizedPage screen.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UnauthorizedPageProps {
  onReturnToDashboard: () => void;
}

/**
 * UnauthorizedPage component
 *
 * Role access denied fallback screen.
 */
export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ onReturnToDashboard }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
            Access Denied / 403 Forbidden
          </h2>
          <p className="text-xs text-slate-500">
            Your current authenticated profile (<strong>{user?.role || 'Guest'}</strong>) is not authorized to view this restricted module.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left space-y-1">
          <span className="font-semibold block text-slate-700">Security Policy:</span>
          <p className="text-[11px] leading-relaxed">
            Agency financial records, internal incidents, and competing vendor quotes are protected under strict RLS policies.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onReturnToDashboard}
            className="w-full bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Return to Authorized Dashboard
          </button>

          <button
            onClick={logout}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
          >
            Sign Out & Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};
